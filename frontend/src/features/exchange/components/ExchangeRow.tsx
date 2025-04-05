import { Control, UseFormSetValue, useWatch } from 'react-hook-form';
import type { Currency } from '@/types';
import type { ExchangeOrderFormData } from '@/shared/validation/exchange';
import { formatAmount } from '@/shared/validation/exchange';
import { Input } from '@/shared/ui/Input';
import { Dropdown } from '@/shared/ui/Dropdown';
import { Button } from '@/shared/ui/Button';
import { Trash2 } from 'lucide-react';

interface ExchangeRowProps {
  index: number;
  control: Control<ExchangeOrderFormData>;
  setValue: UseFormSetValue<ExchangeOrderFormData>;
  currencies: Currency[];
  onRemove: () => void;
  isRemovable: boolean;
}

export const ExchangeRow = ({
  index,
  control,
  setValue,
  currencies,
  onRemove,
  isRemovable,
}: ExchangeRowProps) => {
  // Используем useWatch для отслеживания изменений полей
  const values = useWatch({
    control,
    name: `exchangePairs.${index}`,
  });

  const { fromCurrency, toCurrency } = values || {};

  // Создаем опции для выпадающих списков
  const currencyOptions = currencies.map((currency) => ({
    value: currency.code,
    label: `${currency.name}`,
  }));

  // Находим текущие валюты для форматирования
  const fromCurrencyObj = currencies.find((c) => c.code === fromCurrency);
  const toCurrencyObj = currencies.find((c) => c.code === toCurrency);

  return (
    <div className="exchange-row">
      <div className="exchange-currency-group">
        <div className="exchange-currency">
          <Dropdown
            options={currencyOptions}
            value={fromCurrency || ''}
            onChange={(value) => setValue(`exchangePairs.${index}.fromCurrency`, value)}
            label="Валюта отправления"
          />
        </div>
        <div className="exchange-amount">
          <Input
            type="number"
            label="Сумма отправления"
            {...control.register(`exchangePairs.${index}.fromAmount`, {
              valueAsNumber: true,
              onChange: (e) => {
                if (fromCurrencyObj) {
                  e.target.value = formatAmount(Number(e.target.value), fromCurrencyObj);
                }
              },
            })}
          />
        </div>
      </div>

      <div className="exchange-currency-group">
        <div className="exchange-currency">
          <Dropdown
            options={currencyOptions}
            value={toCurrency || ''}
            onChange={(value) => setValue(`exchangePairs.${index}.toCurrency`, value)}
            label="Валюта получения"
          />
        </div>
        <div className="exchange-amount">
          <Input
            type="number"
            label="Сумма получения"
            {...control.register(`exchangePairs.${index}.toAmount`, {
              valueAsNumber: true,
              onChange: (e) => {
                if (toCurrencyObj) {
                  e.target.value = formatAmount(Number(e.target.value), toCurrencyObj);
                }
              },
            })}
          />
        </div>
      </div>

      {isRemovable && (
        <div className="exchange-remove">
          <Button
            variant="secondary"
            onClick={onRemove}
            className="remove-button"
            aria-label="Удалить строку обмена"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
};
