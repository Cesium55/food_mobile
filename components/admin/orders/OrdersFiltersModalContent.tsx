import { IconSymbol } from '@/components/ui/icon-symbol';
import { useModal } from '@/contexts/ModalContext';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type OrdersTimePeriod = 'today' | 'week' | 'month' | 'all';

interface ShopFilterItem {
  id: number;
  shortName?: string;
  address?: string;
}

interface OrdersFiltersModalContentProps {
  selectedTimePeriod: OrdersTimePeriod;
  selectedShopIds: number[];
  shops: ShopFilterItem[];
  onSelectTimePeriod: (period: OrdersTimePeriod) => void;
  onToggleShopFilter: (shopId: number) => void;
  onClearFilters: () => void;
}

export function OrdersFiltersModalContent({
  selectedTimePeriod,
  selectedShopIds,
  shops,
  onSelectTimePeriod,
  onToggleShopFilter,
  onClearFilters,
}: OrdersFiltersModalContentProps) {
  const { closeModal } = useModal();

  return (
    <View style={styles.filterModal}>
      <View style={styles.filterHeader}>
        <Text style={styles.filterTitle}>Фильтры</Text>
      </View>

      <View style={styles.filterContent}>
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Период</Text>
          <View style={styles.timePeriodButtons}>
            {[
              { value: 'today' as OrdersTimePeriod, label: 'Сегодня' },
              { value: 'week' as OrdersTimePeriod, label: 'Неделя' },
              { value: 'month' as OrdersTimePeriod, label: 'Месяц' },
              { value: 'all' as OrdersTimePeriod, label: 'Все время' },
            ].map((period) => (
              <TouchableOpacity
                key={period.value}
                style={[
                  styles.timePeriodButton,
                  selectedTimePeriod === period.value && styles.timePeriodButtonActive,
                ]}
                onPress={() => onSelectTimePeriod(period.value)}
              >
                <Text
                  style={[
                    styles.timePeriodButtonText,
                    selectedTimePeriod === period.value && styles.timePeriodButtonTextActive,
                  ]}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Торговые точки</Text>
          {shops.map((shop) => (
            <TouchableOpacity
              key={shop.id}
              style={styles.filterItem}
              onPress={() => onToggleShopFilter(shop.id)}
            >
              <View style={styles.filterItemLeft}>
                <Text style={styles.filterItemName}>{shop.shortName || `Точка #${shop.id}`}</Text>
                <Text style={styles.filterItemSubtitle}>{shop.address || 'Адрес не указан'}</Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  selectedShopIds.includes(shop.id) && styles.checkboxChecked,
                ]}
              >
                {selectedShopIds.includes(shop.id) && (
                  <IconSymbol name="checkmark" size={16} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.filterActions}>
        <TouchableOpacity style={styles.clearButton} onPress={onClearFilters}>
          <Text style={styles.clearButtonText}>Очистить</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyButton} onPress={closeModal}>
          <Text style={styles.applyButtonText}>Применить</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterModal: {
    backgroundColor: '#fff',
  },
  filterHeader: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  filterContent: {
    paddingBottom: 8,
  },
  filterSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  timePeriodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timePeriodButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#fff',
  },
  timePeriodButtonActive: {
    backgroundColor: '#007AFF',
  },
  timePeriodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  timePeriodButtonTextActive: {
    color: '#fff',
  },
  filterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  filterItemLeft: {
    flex: 1,
  },
  filterItemName: {
    fontSize: 15,
    color: '#333',
    marginBottom: 2,
  },
  filterItemSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
