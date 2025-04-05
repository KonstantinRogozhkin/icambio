import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card';
import { PageTitle } from '@/shared/ui/PageTitle';
import { Input } from '@/shared/ui/Input';
import { useNotification } from '@/lib/hooks/useNotification';
import { mockCurrencies, calculateToAmount, calculateFromAmount } from '@/mocks/exchange-data';
import { logger } from '@/lib/utils/logger';
import { ArrowRightIcon, ArrowLeftIcon, PlusIcon, XMarkIcon, ShoppingCartIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

export function ExchangePage() {
  const { success, error } = useNotification();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Инициализируем состояние с пустыми значениями
  const [pairs, setPairs] = useState([
    { fromCurrency: '', toCurrency: '', fromAmount: 0, toAmount: 0 }
  ]);
  
  // Флаг для предотвращения зацикливания при обновлении
  const isUpdating = useRef(false);
  
  // Загружаем данные из localStorage при монтировании компонента
  useEffect(() => {
    try {
      const savedDataJson = localStorage.getItem('exchangeCalculatorData');
      if (savedDataJson) {
        logger.info(`Loading saved data: ${savedDataJson}`);
        
        try {
          const savedData = JSON.parse(savedDataJson);
          logger.info(`Parsed saved data: ${JSON.stringify(savedData)}`);

          // Проверяем, что все необходимые поля присутствуют
          if (
            savedData &&
            typeof savedData === 'object' &&
            'fromCurrency' in savedData &&
            'toCurrency' in savedData &&
            'fromAmount' in savedData &&
            'toAmount' in savedData
          ) {
            logger.info(`Successfully loaded exchange data: fromCurrency=${savedData.fromCurrency}, toCurrency=${savedData.toCurrency}, fromAmount=${savedData.fromAmount}, toAmount=${savedData.toAmount}`);

            // Устанавливаем состояние
            setPairs([{
              fromCurrency: savedData.fromCurrency,
              toCurrency: savedData.toCurrency,
              fromAmount: Number(savedData.fromAmount),
              toAmount: Number(savedData.toAmount)
            }]);

            // Удаляем данные из localStorage после использования
            localStorage.removeItem('exchangeCalculatorData');
          } else {
            logger.warn(`Invalid saved data format: ${JSON.stringify(savedData)}`);
          }
        } catch (error) {
          logger.error(`Error parsing saved data: ${error}`);
        }
      } else {
        logger.info('No saved exchange data found');
      }
    } catch (e) {
      logger.error('Error loading exchange data', e);
      error('Произошла ошибка при загрузке данных обмена');
    }
  }, [error]);
  
  const [contactInfo, setContactInfo] = useState({
    whatsapp: '',
    telegram: '',
    delivery: false,
    address: '',
    comment: '',
  });

  // Добавление новой валютной пары
  const handleAddPair = () => {
    // Создаем новую пару со значениями по умолчанию USDT -> ARS
    const defaultFromCurrency = 'USDT';
    const defaultToCurrency = 'ARS';
    const defaultFromAmount = 100;
    
    // Рассчитываем сумму получения на основе курса обмена
    const calculatedToAmount = calculateToAmount(defaultFromCurrency, defaultToCurrency, defaultFromAmount);
    
    // Добавляем новую пару с предустановленными значениями
    setPairs([
      ...pairs, 
      { 
        fromCurrency: defaultFromCurrency, 
        toCurrency: defaultToCurrency, 
        fromAmount: defaultFromAmount, 
        toAmount: calculatedToAmount || 0 
      }
    ]);
  };

  // Удаление валютной пары
  const handleRemovePair = (index: number) => {
    const newPairs = [...pairs];
    newPairs.splice(index, 1);
    setPairs(newPairs);
  };

  // Обновление значения пары
  const handlePairChange = (index: number, field: string, value: string | number) => {
    // Если уже идет обновление, выходим, чтобы избежать зацикливания
    if (isUpdating.current) return;
    
    isUpdating.current = true; // Устанавливаем флаг обновления
    
    const newPairs = [...pairs];
    const pair = { ...newPairs[index], [field]: value };
    
    // Автоматический расчет при изменении валюты или суммы
    if (field === 'fromAmount' && pair.fromCurrency && pair.toCurrency) {
      const calculated = calculateToAmount(pair.fromCurrency, pair.toCurrency, Number(value));
      if (calculated !== null) {
        pair.toAmount = calculated;
      }
    } else if (field === 'toAmount' && pair.fromCurrency && pair.toCurrency) {
      const calculated = calculateFromAmount(pair.fromCurrency, pair.toCurrency, Number(value));
      if (calculated !== null) {
        pair.fromAmount = calculated;
      }
    } else if ((field === 'fromCurrency' || field === 'toCurrency') && 
               pair.fromCurrency && pair.toCurrency && pair.fromAmount > 0) {
      const calculated = calculateToAmount(pair.fromCurrency, pair.toCurrency, pair.fromAmount);
      if (calculated !== null) {
        pair.toAmount = calculated;
      }
    }
    
    newPairs[index] = pair;
    setPairs(newPairs);
    
    // Сбрасываем флаг в следующем цикле событий
    setTimeout(() => {
      isUpdating.current = false;
    }, 0);
  };

  // Обновление контактной информации
  const handleContactChange = (field: string, value: string | boolean) => {
    setContactInfo({ ...contactInfo, [field]: value });
  };

  // Переход к шагу 2
  const handleContinue = () => {
    const isValid = pairs.every(
      (pair) => pair.fromCurrency && pair.toCurrency && pair.fromAmount > 0
    );

    if (isValid) {
      setCurrentStep(2);
    } else {
      error('Пожалуйста, заполните все поля валютных пар корректно');
    }
  };

  // Возврат к шагу 1
  const handleBack = () => {
    setCurrentStep(1);
  };

  // Создание заказа
  const handleCreateOrder = () => {
    if (!contactInfo.whatsapp && !contactInfo.telegram) {
      error('Укажите хотя бы один способ связи (WhatsApp или Telegram)');
      return;
    }

    if (contactInfo.delivery && !contactInfo.address) {
      error('При выборе доставки необходимо указать адрес');
      return;
    }

    try {
      // Здесь будет отправка данных на сервер
      success('Заказ успешно создан');
      // Здесь должен быть редирект на страницу с уникальной ссылкой
    } catch (err: unknown) {
      if (err instanceof Error) {
        error(err.message);
      } else {
        error('Не удалось создать заказ');
      }
    }
  };

  // Отмена и возврат на главную
  const handleCancel = () => {
    window.history.back();
  };

  return (
    <div className="page-container">
      <div className="component-container">
        <PageTitle
          title="Заказать обмен"
          description={
            currentStep === 1
              ? 'Выберите валюты и введите суммы для обмена'
              : 'Укажите контактные данные для завершения заказа'
          }
        />

        <Card className="w-full bg-white">
          <CardHeader>
            <CardTitle>
              {currentStep === 1 ? 'Шаг 1: Детали обмена' : 'Шаг 2: Контактная информация'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentStep === 1 ? (
              // Шаг 1: Выбор валют и сумм
              <div className="space-y-6">
                {pairs.map((pair, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-100 relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center relative">
                      <div className="md:pr-8">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Отдаете*
                        </label>
                        <div className="flex">
                          <select
                            value={pair.fromCurrency}
                            onChange={(e) => handlePairChange(index, 'fromCurrency', e.target.value)}
                            className="form-input rounded-r-none w-1/3 border-r-0"
                          >
                            <option value="">Выберите...</option>
                            {mockCurrencies.map((currency) => (
                              <option key={currency.code} value={currency.code}>
                                {currency.code}
                              </option>
                            ))}
                          </select>
                          <Input
                            type="number"
                            value={pair.fromAmount || ''}
                            onChange={(e) => handlePairChange(index, 'fromAmount', Number(e.target.value))}
                            className="rounded-l-none w-2/3"
                            min="0"
                          />
                        </div>
                      </div>

                      <div className="hidden md:block absolute left-1/2 -translate-x-1/2" style={{ top: '2.5rem', marginLeft: '-15px' }}>
                        <div className="bg-white p-1.5 rounded-full shadow-sm border border-gray-200">
                          <ArrowsRightLeftIcon className="h-4 w-4 text-gray-500" />
                        </div>
                      </div>

                      <div className="md:pl-8">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Получаете*
                        </label>
                        <div className="flex">
                          <select
                            value={pair.toCurrency}
                            onChange={(e) => handlePairChange(index, 'toCurrency', e.target.value)}
                            className="form-input rounded-r-none w-1/3 border-r-0"
                          >
                            <option value="">Выберите...</option>
                            {mockCurrencies.map((currency) => (
                              <option key={currency.code} value={currency.code}>
                                {currency.code}
                              </option>
                            ))}
                          </select>
                          <Input
                            type="number"
                            value={pair.toAmount || ''}
                            onChange={(e) => handlePairChange(index, 'toAmount', Number(e.target.value))}
                            className="rounded-l-none w-2/3"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>

                    {pairs.length > 1 && (
                      <button
                        onClick={() => handleRemovePair(index)}
                        className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                        aria-label="Удалить пару обмена"
                      >
                        <XMarkIcon className="h-4 w-4" />
                        <span className="text-xs font-medium">Удалить</span>
                      </button>
                    )}
                  </div>
                ))}

                <div className="flex justify-center mt-8">
                  <button 
                    onClick={handleAddPair} 
                    className="inline-flex items-center gap-1 px-5 py-2.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors font-medium"
                  >
                    <PlusIcon className="h-5 w-5" />
                    <span>Добавить обмен</span>
                  </button>
                </div>

                {pairs.length > 1 && (
                  <div className="mt-8 bg-white p-5 rounded-lg shadow border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Итого по всем обменам:</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Вы отдаете:</span>
                          <div className="space-y-1">
                            {Object.entries(
                              pairs.reduce((acc, pair) => {
                                if (!pair.fromCurrency || pair.fromAmount <= 0) return acc;
                                
                                const currency = pair.fromCurrency;
                                if (!acc[currency]) {
                                  acc[currency] = 0;
                                }
                                acc[currency] += pair.fromAmount;
                                return acc;
                              }, {} as Record<string, number>)
                            ).map(([currency, amount]) => (
                              <div key={currency} className="text-right font-medium">
                                {amount.toFixed(2)} {currency}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Вы получаете:</span>
                          <div className="space-y-1">
                            {Object.entries(
                              pairs.reduce((acc, pair) => {
                                if (!pair.toCurrency || pair.toAmount <= 0) return acc;
                                
                                const currency = pair.toCurrency;
                                if (!acc[currency]) {
                                  acc[currency] = 0;
                                }
                                acc[currency] += pair.toAmount;
                                return acc;
                              }, {} as Record<string, number>)
                            ).map(([currency, amount]) => (
                              <div key={currency} className="text-right font-medium">
                                {amount.toFixed(2)} {currency}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-10 pt-4 border-t border-gray-200">
                  <button 
                    onClick={handleCancel} 
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span>Отмена</span>
                  </button>
                  <button 
                    onClick={handleContinue}
                    className="inline-flex items-center gap-1 px-6 py-2 rounded-lg bg-icmop-primary hover:bg-icmop-dark text-white transition-colors whitespace-nowrap font-medium"
                  >
                    <span>Продолжить</span>
                    <ArrowRightIcon className="h-4 w-4 flex-shrink-0" />
                  </button>
                </div>
              </div>
            ) : (
              // Шаг 2: Контактная информация
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Ваш заказ</h3>
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    {pairs.map((pair, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
                      >
                        <span className="font-medium">
                          {pair.fromAmount} {pair.fromCurrency}
                        </span>
                        <span className="text-gray-500">→</span>
                        <span className="font-medium">
                          {pair.toAmount} {pair.toCurrency}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        WhatsApp
                        <span className="text-gray-500 text-xs ml-1">(опционально)</span>
                      </label>
                      <Input
                        type="text"
                        value={contactInfo.whatsapp}
                        onChange={(e) => handleContactChange('whatsapp', e.target.value)}
                        placeholder="+7 999 123-45-67"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telegram
                        <span className="text-gray-500 text-xs ml-1">(опционально)</span>
                      </label>
                      <Input
                        type="text"
                        value={contactInfo.telegram}
                        onChange={(e) => handleContactChange('telegram', e.target.value)}
                        placeholder="@username"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="delivery"
                        checked={contactInfo.delivery}
                        onChange={(e) => handleContactChange('delivery', e.target.checked)}
                        className="h-4 w-4 text-icmop-primary focus:ring-icmop-primary border-gray-300 rounded"
                      />
                      <label htmlFor="delivery" className="ml-2 block text-sm text-gray-900">
                        Нужна доставка
                      </label>
                    </div>

                    {contactInfo.delivery && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Адрес доставки*
                        </label>
                        <Input
                          type="text"
                          value={contactInfo.address}
                          onChange={(e) => handleContactChange('address', e.target.value)}
                          placeholder="Введите адрес доставки"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Комментарий
                        <span className="text-gray-500 text-xs ml-1">(опционально)</span>
                      </label>
                      <textarea
                        value={contactInfo.comment}
                        onChange={(e) => handleContactChange('comment', e.target.value)}
                        rows={3}
                        className="form-input w-full rounded-md"
                        placeholder="Дополнительная информация..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button 
                    onClick={handleBack} 
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    <span>Назад</span>
                  </button>
                  <button 
                    onClick={handleCreateOrder}
                    className="inline-flex items-center gap-1 px-6 py-2 rounded-lg bg-icmop-primary hover:bg-icmop-dark text-white transition-colors whitespace-nowrap font-medium"
                  >
                    <ShoppingCartIcon className="h-4 w-4" />
                    <span>Создать заказ</span>
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}