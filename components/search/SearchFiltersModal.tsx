import Search from '@/components/search/search';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { spacing, typography } from '@/constants/tokens';
import { useModal } from '@/contexts/ModalContext';
import { useColors } from '@/contexts/ThemeContext';
import { Category, useCategories } from '@/hooks/useCategories';
import { useMemo, useState } from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export interface SearchFiltersValue {
  searchQuery: string;
  minPrice?: number;
  maxPrice?: number;
  minExpiryDate?: string;
  maxExpiryDate?: string;
  minCount?: number;
  categoryIds: number[];
  dynamicPricing?: boolean;
}

interface SearchFiltersModalProps {
  initialValue: SearchFiltersValue;
  onApply: (value: SearchFiltersValue) => void;
}

type DynamicPricingOption = 'all' | 'dynamic' | 'fixed';

function getDynamicPricingOption(value?: boolean): DynamicPricingOption {
  if (value === true) {
    return 'dynamic';
  }

  if (value === false) {
    return 'fixed';
  }

  return 'all';
}

function normalizeNumber(value: string): number | undefined {
  const normalized = value.replace(',', '.').trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
}

function normalizeInteger(value: string): number | undefined {
  const parsed = normalizeNumber(value);
  if (parsed === undefined) {
    return undefined;
  }

  return Math.floor(parsed);
}

export function SearchFiltersModal({
  initialValue,
  onApply,
}: SearchFiltersModalProps) {
  const { closeModal } = useModal();
  const { categories } = useCategories();
  const colors = useColors();
  const styles = createStyles(colors);

  const [searchQuery, setSearchQuery] = useState(initialValue.searchQuery);
  const [minPrice, setMinPrice] = useState(initialValue.minPrice?.toString() ?? '');
  const [maxPrice, setMaxPrice] = useState(initialValue.maxPrice?.toString() ?? '');
  const [minExpiryDate, setMinExpiryDate] = useState<Date | null>(
    initialValue.minExpiryDate ? new Date(initialValue.minExpiryDate) : null
  );
  const [maxExpiryDate, setMaxExpiryDate] = useState<Date | null>(
    initialValue.maxExpiryDate ? new Date(initialValue.maxExpiryDate) : null
  );
  const [minCount, setMinCount] = useState(initialValue.minCount?.toString() ?? '');
  const [categoryIds, setCategoryIds] = useState<number[]>(initialValue.categoryIds);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [dynamicPricing, setDynamicPricing] = useState<DynamicPricingOption>(
    getDynamicPricingOption(initialValue.dynamicPricing)
  );
  const [isDynamicPricingOpen, setIsDynamicPricingOpen] = useState(false);
  const [isMinExpiryPickerVisible, setIsMinExpiryPickerVisible] = useState(false);
  const [isMaxExpiryPickerVisible, setIsMaxExpiryPickerVisible] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const topLevelCategories = useMemo(
    () => categories.filter((category) => category.parent_category_id === null),
    [categories]
  );

  const handleToggleCategory = (categoryId: number) => {
    setCategoryIds((current) => {
      if (current.includes(categoryId)) {
        return current.filter((id) => id !== categoryId);
      }

      const pathIds: number[] = [];
      let currentCategory = categories.find((item) => item.id === categoryId);

      while (currentCategory) {
        pathIds.unshift(currentCategory.id);
        const parentCategoryId = currentCategory.parent_category_id;
        currentCategory = parentCategoryId === null
          ? undefined
          : categories.find((item) => item.id === parentCategoryId);
      }

      return [...new Set([...current, ...pathIds])];
    });
  };

  const handleToggleExpand = (categoryId: number) => {
    setExpandedCategories((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    );
  };

  const handleClear = () => {
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setMinExpiryDate(null);
    setMaxExpiryDate(null);
    setMinCount('');
    setCategoryIds([]);
    setDynamicPricing('all');
    setIsDynamicPricingOpen(false);
    setIsCategoriesOpen(false);
    setValidationError(null);
  };

  const handleApply = () => {
    if (minPrice.trim() && normalizeNumber(minPrice) === undefined) {
      setValidationError('Минимальная цена должна быть числом.');
      return;
    }

    if (maxPrice.trim() && normalizeNumber(maxPrice) === undefined) {
      setValidationError('Максимальная цена должна быть числом.');
      return;
    }

    if (minCount.trim() && normalizeInteger(minCount) === undefined) {
      setValidationError('Минимальное количество должно быть числом.');
      return;
    }

    const normalizedMinPrice = normalizeNumber(minPrice);
    const normalizedMaxPrice = normalizeNumber(maxPrice);

    if (normalizedMinPrice !== undefined && normalizedMaxPrice !== undefined && normalizedMaxPrice < normalizedMinPrice) {
      setValidationError('Максимальная цена не может быть меньше минимальной.');
      return;
    }

    if (minExpiryDate && maxExpiryDate && maxExpiryDate.getTime() < minExpiryDate.getTime()) {
      setValidationError('Максимальная дата срока годности не может быть раньше минимальной.');
      return;
    }
    setValidationError(null);

    const normalizedValue: SearchFiltersValue = {
      searchQuery: searchQuery.trim(),
      minPrice: normalizedMinPrice,
      maxPrice: normalizedMaxPrice,
      minExpiryDate: minExpiryDate?.toISOString(),
      maxExpiryDate: maxExpiryDate?.toISOString(),
      minCount: normalizeInteger(minCount),
      categoryIds,
      dynamicPricing:
        dynamicPricing === 'all'
          ? undefined
          : dynamicPricing === 'dynamic',
    };

    onApply(normalizedValue);
    closeModal();
  };

  const dynamicPricingOptions: Array<{ label: string; value: DynamicPricingOption }> = [
    { label: 'Без фильтра', value: 'all' },
    { label: 'Только динамическая', value: 'dynamic' },
    { label: 'Только фиксированная', value: 'fixed' },
  ];

  const formatDateTime = (value: Date | null) => {
    if (!value) {
      return '';
    }

    return value.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderCategoryItem = (category: Category, level = 0) => {
    const subCategories = categories.filter((item) => item.parent_category_id === category.id);
    const hasChildren = subCategories.length > 0;
    const isExpanded = expandedCategories.includes(category.id);
    const isSelected = categoryIds.includes(category.id);

    return (
      <View key={category.id} style={level === 0 ? styles.categoryGroup : undefined}>
        {level === 0 ? (
          <View style={styles.categoryHeaderRow}>
            {hasChildren ? (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => handleToggleExpand(category.id)}
                activeOpacity={0.7}
              >
                <IconSymbol
                  name={isExpanded ? 'chevron.down' : 'chevron.right'}
                  size={18}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.expandButtonSpacer} />
            )}
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => handleToggleCategory(category.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryTitle}>{category.name}</Text>
              {isSelected && (
                <View style={styles.categoryHeaderBadge}>
                  <Text style={styles.categoryHeaderBadgeText}>Выбрано</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.subCategoryRow}>
            {hasChildren ? (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => handleToggleExpand(category.id)}
                activeOpacity={0.7}
              >
                <IconSymbol
                  name={isExpanded ? 'chevron.down' : 'chevron.right'}
                  size={16}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.expandButtonSpacer} />
            )}
            <TouchableOpacity
              style={[
                styles.subCategoryButton,
                { paddingLeft: 12 + (level - 1) * 16 },
                isSelected && styles.subCategoryButtonSelected,
              ]}
              onPress={() => handleToggleCategory(category.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.subCategoryText,
                  isSelected && styles.subCategoryTextSelected,
                ]}
              >
                {category.name}
              </Text>
              {isSelected && (
                <IconSymbol name="checkmark" size={18} color={colors.primary[500]} />
              )}
            </TouchableOpacity>
          </View>
        )}

        {isExpanded && hasChildren && (
          <View style={styles.subCategoriesContainer}>
            {subCategories.map((subCategory) => renderCategoryItem(subCategory, level + 1))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Фильтры поиска</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Поиск</Text>
        <Search
          placeholder="Поиск"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={handleApply}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Цена</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            value={minPrice}
            onChangeText={setMinPrice}
            placeholder="Мин цена"
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            value={maxPrice}
            onChangeText={setMaxPrice}
            placeholder="Макс цена"
            keyboardType="numeric"
          />
        </View>
      </View>
      {validationError && (
        <Text style={styles.errorText}>{validationError}</Text>
      )}

      <View style={styles.section}>
        <Text style={styles.label}>Срок годности</Text>
        <Text style={styles.hint}>Укажите минимальную и максимальную дату через календарь</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.input, styles.halfInput, styles.dateInput]}
            onPress={() => setIsMinExpiryPickerVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={minExpiryDate ? styles.dateInputText : styles.dateInputPlaceholder}>
              {minExpiryDate ? formatDateTime(minExpiryDate) : 'Мин дата'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.input, styles.halfInput, styles.dateInput]}
            onPress={() => setIsMaxExpiryPickerVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={maxExpiryDate ? styles.dateInputText : styles.dateInputPlaceholder}>
              {maxExpiryDate ? formatDateTime(maxExpiryDate) : 'Макс дата'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Динамическая цена</Text>
        <View style={styles.selectWrapper}>
          <TouchableOpacity
            style={styles.selectTrigger}
            onPress={() => setIsDynamicPricingOpen((current) => !current)}
            activeOpacity={0.7}
          >
            <Text style={styles.selectTriggerText}>
              {dynamicPricingOptions.find((option) => option.value === dynamicPricing)?.label}
            </Text>
            <IconSymbol
              name={isDynamicPricingOpen ? 'chevron.down' : 'chevron.right'}
              size={18}
              color={colors.text.secondary}
            />
          </TouchableOpacity>

          {isDynamicPricingOpen && (
            <View style={styles.selectOptions}>
              {dynamicPricingOptions.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.selectOption,
                    index === dynamicPricingOptions.length - 1 && styles.selectOptionLast,
                  ]}
                  onPress={() => {
                    setDynamicPricing(option.value);
                    setIsDynamicPricingOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      dynamicPricing === option.value && styles.selectOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {dynamicPricing === option.value && (
                    <IconSymbol name="checkmark" size={16} color={colors.primary[500]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Минимальное количество</Text>
        <TextInput
          style={styles.input}
          value={minCount}
          onChangeText={setMinCount}
          placeholder="Например, 3"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionToggle}
          onPress={() => setIsCategoriesOpen((current) => !current)}
          activeOpacity={0.7}
        >
          <View>
            <Text style={styles.label}>Категории</Text>
            <Text style={styles.hint}>Выберите одну или несколько категорий</Text>
          </View>
          <IconSymbol
            name={isCategoriesOpen ? 'chevron.down' : 'chevron.right'}
            size={20}
            color={colors.text.secondary}
          />
        </TouchableOpacity>
        {isCategoriesOpen && (
          <ScrollView
            style={styles.categoryTree}
            contentContainerStyle={styles.categoryTreeContent}
            nestedScrollEnabled
          >
            {topLevelCategories.map((category) => renderCategoryItem(category))}
          </ScrollView>
        )}
      </View>

      <View style={styles.actions}>
        <Button size="lg" fullWidth style={[styles.actionButton, styles.clearActionButton]} onPress={handleClear}>
          Очистить
        </Button>
        <Button size="lg" fullWidth style={styles.actionButton} onPress={handleApply}>
          Применить
        </Button>
      </View>

      <DateTimePickerModal
        isVisible={isMinExpiryPickerVisible}
        mode="datetime"
        date={minExpiryDate || new Date()}
        minimumDate={new Date()}
        onConfirm={(date) => {
          setMinExpiryDate(date);
          setIsMinExpiryPickerVisible(false);
          setValidationError(null);
        }}
        onCancel={() => setIsMinExpiryPickerVisible(false)}
      />

      <DateTimePickerModal
        isVisible={isMaxExpiryPickerVisible}
        mode="datetime"
        date={maxExpiryDate || minExpiryDate || new Date()}
        minimumDate={minExpiryDate || new Date()}
        onConfirm={(date) => {
          setMaxExpiryDate(date);
          setIsMaxExpiryPickerVisible(false);
          setValidationError(null);
        }}
        onCancel={() => setIsMaxExpiryPickerVisible(false)}
      />
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
    },
    title: {
      fontSize: typography.fontSize.xl,
      fontFamily: typography.fontFamily.bold,
      color: colors.text.primary,
    },
    section: {
      gap: spacing.sm,
    },
    label: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.semibold,
      color: colors.text.primary,
    },
    hint: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.regular,
      color: colors.text.secondary,
    },
    errorText: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
      color: '#D64545',
      marginTop: -spacing.sm,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    sectionToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    input: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: colors.border.default,
      borderRadius: 14,
      backgroundColor: '#F7F7F7',
      paddingHorizontal: spacing.md,
      fontSize: typography.fontSize.base,
      color: colors.text.primary,
      fontFamily: typography.fontFamily.regular,
    },
    halfInput: {
      flex: 1,
    },
    dateInput: {
      justifyContent: 'center',
    },
    dateInputText: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.regular,
      color: colors.text.primary,
    },
    dateInputPlaceholder: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.regular,
      color: colors.text.secondary,
    },
    selectWrapper: {
      gap: spacing.xs,
    },
    selectTrigger: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: colors.border.default,
      borderRadius: 14,
      backgroundColor: '#F7F7F7',
      paddingHorizontal: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectTriggerText: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.regular,
      color: colors.text.primary,
    },
    selectOptions: {
      borderWidth: 1,
      borderColor: colors.border.default,
      borderRadius: 14,
      backgroundColor: '#FFFFFF',
      overflow: 'hidden',
    },
    selectOption: {
      minHeight: 46,
      paddingHorizontal: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
    },
    selectOptionLast: {
      borderBottomWidth: 0,
    },
    selectOptionText: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.regular,
      color: colors.text.primary,
    },
    selectOptionTextActive: {
      color: colors.primary[500],
      fontFamily: typography.fontFamily.semibold,
    },
    categoryTree: {
      maxHeight: 320,
      borderWidth: 1,
      borderColor: colors.border.default,
      borderRadius: 16,
      backgroundColor: '#FAFAFA',
    },
    categoryTreeContent: {
      padding: spacing.md,
    },
    categoryGroup: {
      marginBottom: spacing.sm,
    },
    categoryHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    expandButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    expandButtonSpacer: {
      width: 32,
      height: 32,
    },
    categoryHeader: {
      flex: 1,
      minHeight: 44,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    categoryTitle: {
      flex: 1,
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.semibold,
      color: colors.text.primary,
    },
    categoryHeaderBadge: {
      marginLeft: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.primary[50],
    },
    categoryHeaderBadgeText: {
      color: colors.primary[500],
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.semibold,
    },
    subCategoriesContainer: {
      marginTop: spacing.xs,
      gap: spacing.xs,
    },
    subCategoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    subCategoryButton: {
      flex: 1,
      minHeight: 42,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border.default,
      paddingRight: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    subCategoryButtonSelected: {
      backgroundColor: colors.primary[50],
      borderColor: colors.primary[200],
    },
    subCategoryText: {
      flex: 1,
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
      color: colors.text.primary,
    },
    subCategoryTextSelected: {
      color: colors.primary[500],
      fontFamily: typography.fontFamily.semibold,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingTop: spacing.sm,
    },
    actionButton: {
      flex: 1,
    },
    clearActionButton: {
      backgroundColor: '#D9D9D9',
    },
  });
