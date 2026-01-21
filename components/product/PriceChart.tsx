import { Offer } from '@/hooks/useOffers';
import { calculateDynamicPrice } from '@/utils/pricingUtils';
import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface PriceChartProps {
  offer: Offer;
}

interface PricePoint {
  timeRemaining: number; // секунды до истечения
  price: number;
  label: string; // метка времени (например, "3 дня", "12 часов")
}

export default function PriceChart({ offer }: PriceChartProps) {
  // Генерируем точки графика на основе стратегии
  const { pricePoints, chartData } = useMemo(() => {
    if (!offer.isDynamicPricing || !offer.pricingStrategy || !offer.pricingStrategy.steps.length) {
      return { pricePoints: [], chartData: null };
    }

    const now = new Date();
    const expiryDate = new Date(offer.expiresDate);
    const totalSeconds = Math.floor((expiryDate.getTime() - now.getTime()) / 1000);

    if (totalSeconds <= 0) {
      return { pricePoints: [], chartData: null };
    }

    // Сортируем шаги по убыванию времени
    const sortedSteps = [...offer.pricingStrategy.steps].sort(
      (a, b) => b.time_remaining_seconds - a.time_remaining_seconds
    );

    const points: PricePoint[] = [];
    
    // Функция для форматирования подписи (короткий формат с одной буквой "д")
    const formatLabel = (timeRemaining: number, isCurrent: boolean, isExpiry: boolean): string => {
      if (isCurrent) {
        return 'Сейчас';
      }
      if (isExpiry) {
        return 'Истечение';
      }
      
      const hours = Math.floor(timeRemaining / 3600);
      const days = Math.floor(hours / 24);
      const minutes = Math.floor((timeRemaining % 3600) / 60);
      
      if (days > 0) {
        return `${days}д`;
      } else if (hours > 0) {
        return `${hours}ч`;
      } else {
        return `${minutes}м`;
      }
    };

    // Добавляем начальную точку (текущее время, текущая цена)
    const currentPrice = calculateDynamicPrice(offer);
    if (currentPrice !== null) {
      points.push({
        timeRemaining: totalSeconds,
        price: parseFloat(currentPrice),
        label: formatLabel(totalSeconds, true, false),
      });
    }

    // Добавляем точки для каждого шага стратегии
    const originalCostNum = parseFloat(offer.originalCost);
    sortedSteps.forEach((step) => {
      if (step.time_remaining_seconds <= totalSeconds) {
        const price = originalCostNum * (1 - step.discount_percent / 100);
        points.push({
          timeRemaining: step.time_remaining_seconds,
          price,
          label: formatLabel(step.time_remaining_seconds, false, false),
        });
      }
    });

    // Добавляем финальную точку (истечение срока)
    if (sortedSteps.length > 0) {
      const lastStep = sortedSteps[sortedSteps.length - 1];
      const finalPrice = originalCostNum * (1 - lastStep.discount_percent / 100);
      points.push({
        timeRemaining: 0,
        price: finalPrice,
        label: formatLabel(0, false, true),
      });
    }

    // Сортируем по убыванию времени (от большего к меньшему)
    const sortedPoints = points.sort((a, b) => b.timeRemaining - a.timeRemaining);

    // Подготавливаем данные для графика
    const labels = sortedPoints.map(p => p.label);
    const prices = sortedPoints.map(p => p.price);

    const data = {
      labels,
      datasets: [
        {
          data: prices,
          color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`, // Оранжевый цвет
          strokeWidth: 2,
        },
      ],
    };

    return { pricePoints: sortedPoints, chartData: { data } };
  }, [offer]);

  if (!offer.isDynamicPricing || !offer.pricingStrategy || pricePoints.length === 0 || !chartData) {
    return null;
  }

  const screenWidth = Dimensions.get('window').width;
  // График должен быть на всю ширину без боковых отступов
  // chartSectionContainer: marginHorizontal: -16, paddingHorizontal: 0
  // infoSection: paddingHorizontal: 36
  // Доступная ширина = screenWidth - (36-16)*2 = screenWidth - 40
  const chartWidth = screenWidth - 40;

  // Конфигурация графика с оранжевыми цветами
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`, // Оранжевый цвет
    labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#FF9800',
      fill: '#ffffff',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#E0E0E0',
      strokeWidth: 1,
    },
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>График изменения цены</Text>
        <Text style={styles.subtitle}>Цена будет снижаться по мере приближения срока годности</Text>
      </View>

      <LineChart
        data={chartData.data}
        width={chartWidth}
        height={220}
        yAxisLabel="₽"
        yAxisSuffix=""
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines={true}
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLines={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 0, // Убираем боковые отступы
    marginTop: 16,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
    paddingHorizontal: 16, // Добавляем отступы только для заголовка
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
