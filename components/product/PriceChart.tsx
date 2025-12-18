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
    
    // Добавляем начальную точку (текущее время, текущая цена)
    const currentPrice = calculateDynamicPrice(offer);
    if (currentPrice !== null) {
      points.push({
        timeRemaining: totalSeconds,
        price: currentPrice,
        label: 'Сейчас',
      });
    }

    // Добавляем точки для каждого шага стратегии
    sortedSteps.forEach((step) => {
      if (step.time_remaining_seconds <= totalSeconds) {
        const price = offer.originalCost * (1 - step.discount_percent / 100);
        const hours = Math.floor(step.time_remaining_seconds / 3600);
        const days = Math.floor(hours / 24);
        
        let label: string;
        if (days > 0) {
          label = `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`;
        } else if (hours > 0) {
          label = `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}`;
        } else {
          const minutes = Math.floor(step.time_remaining_seconds / 60);
          label = `${minutes} мин`;
        }

        points.push({
          timeRemaining: step.time_remaining_seconds,
          price,
          label,
        });
      }
    });

    // Добавляем финальную точку (истечение срока)
    if (sortedSteps.length > 0) {
      const lastStep = sortedSteps[sortedSteps.length - 1];
      const finalPrice = offer.originalCost * (1 - lastStep.discount_percent / 100);
      points.push({
        timeRemaining: 0,
        price: finalPrice,
        label: 'Истечение',
      });
    }

    // Сортируем по убыванию времени (от большего к меньшему)
    const sortedPoints = points.sort((a, b) => b.timeRemaining - a.timeRemaining);

    // Подготавливаем данные для графика
    const labels = sortedPoints.map(p => p.label);
    const prices = sortedPoints.map(p => p.price);

    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - 80; // Отступы по 40px с каждой стороны

    const data = {
      labels,
      datasets: [
        {
          data: prices,
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Зеленый цвет
          strokeWidth: 2,
        },
      ],
    };

    return { pricePoints: sortedPoints, chartData: { data, chartWidth } };
  }, [offer]);

  if (!offer.isDynamicPricing || !offer.pricingStrategy || pricePoints.length === 0 || !chartData) {
    return null;
  }

  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>График изменения цены</Text>
        <Text style={styles.subtitle}>Цена будет снижаться по мере приближения срока годности</Text>
      </View>

      <LineChart
        data={chartData.data}
        width={chartData.chartWidth}
        height={220}
        yAxisLabel="₽"
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#4CAF50',
            fill: '#ffffff',
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: '#E0E0E0',
            strokeWidth: 1,
          },
        }}
        bezier
        style={styles.chart}
        withInnerLines={true}
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLines={true}
      />

      {/* Легенда */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Текущая цена: {pricePoints[0]?.price.toFixed(2)} ₽</Text>
        </View>
        {pricePoints.length > 1 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.legendText}>
              Финальная цена: {pricePoints[pricePoints.length - 1]?.price.toFixed(2)} ₽
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
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
  legend: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: '#666',
  },
});
