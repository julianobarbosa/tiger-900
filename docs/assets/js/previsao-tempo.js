/**
 * Previsão do Tempo - Serras Gaúchas 2026
 * Integração com Open-Meteo API (gratuita, sem API key)
 */

(function() {
  'use strict';

  // Coordenadas das cidades do roteiro (destino de cada dia)
  var CIDADES = {
    '2026-01-19': { nome: 'Uberaba', lat: -19.7489, lon: -47.9318 },
    '2026-01-20': { nome: 'Ourinhos', lat: -22.9781, lon: -49.8719 },
    '2026-01-21': { nome: 'Ponta Grossa', lat: -25.0994, lon: -50.1583 },
    '2026-01-22': { nome: 'Urubici', lat: -27.9994, lon: -49.5897 },
    '2026-01-23': { nome: 'Urubici', lat: -27.9994, lon: -49.5897 },
    '2026-01-24': { nome: 'Bom Jardim', lat: -28.3389, lon: -49.6358 },
    '2026-01-25': { nome: 'Cambará do Sul', lat: -29.0472, lon: -50.1431 },
    '2026-01-26': { nome: 'Cambará do Sul', lat: -29.0472, lon: -50.1431 },
    '2026-01-27': { nome: 'Bento Gonçalves', lat: -29.1699, lon: -51.5188 },
    '2026-01-28': { nome: 'Bento Gonçalves', lat: -29.1699, lon: -51.5188 },
    '2026-01-29': { nome: 'Curitiba', lat: -25.4284, lon: -49.2733 },
    '2026-01-30': { nome: 'Curitiba', lat: -25.4284, lon: -49.2733 },
    '2026-01-31': { nome: 'Ourinhos', lat: -22.9781, lon: -49.8719 },
    '2026-02-01': { nome: 'Uberaba', lat: -19.7489, lon: -47.9318 },
    '2026-02-02': { nome: 'Goiânia', lat: -16.6869, lon: -49.2648 }
  };

  // Mapeamento de códigos WMO para ícones e descrições
  var WMO_CODES = {
    0: { icon: '☀️', desc: 'Céu limpo' },
    1: { icon: '🌤️', desc: 'Principalmente limpo' },
    2: { icon: '⛅', desc: 'Parcialmente nublado' },
    3: { icon: '☁️', desc: 'Nublado' },
    45: { icon: '🌫️', desc: 'Neblina' },
    48: { icon: '🌫️', desc: 'Neblina com geada' },
    51: { icon: '🌧️', desc: 'Garoa leve' },
    53: { icon: '🌧️', desc: 'Garoa moderada' },
    55: { icon: '🌧️', desc: 'Garoa intensa' },
    61: { icon: '🌧️', desc: 'Chuva leve' },
    63: { icon: '🌧️', desc: 'Chuva moderada' },
    65: { icon: '🌧️', desc: 'Chuva forte' },
    66: { icon: '🌨️', desc: 'Chuva congelante leve' },
    67: { icon: '🌨️', desc: 'Chuva congelante forte' },
    71: { icon: '❄️', desc: 'Neve leve' },
    73: { icon: '❄️', desc: 'Neve moderada' },
    75: { icon: '❄️', desc: 'Neve forte' },
    80: { icon: '🌦️', desc: 'Pancadas leves' },
    81: { icon: '🌦️', desc: 'Pancadas moderadas' },
    82: { icon: '⛈️', desc: 'Pancadas fortes' },
    95: { icon: '⛈️', desc: 'Tempestade' },
    96: { icon: '⛈️', desc: 'Tempestade com granizo leve' },
    99: { icon: '⛈️', desc: 'Tempestade com granizo forte' }
  };

  // Cache key para localStorage
  var CACHE_KEY = 'tiger900_weather_cache';
  var CACHE_DURATION = 3600000; // 1 hora em ms

  /**
   * Obtém previsão do cache ou API
   */
  function getWeatherData() {
    var cached = getCachedWeather();
    if (cached) {
      displayWeather(cached);
      return;
    }

    // Agrupar cidades únicas para reduzir chamadas API
    var uniqueCities = getUniqueCities();
    var promises = uniqueCities.map(function(city) {
      return fetchWeather(city);
    });

    Promise.all(promises)
      .then(function(results) {
        var weatherMap = processResults(uniqueCities, results);
        cacheWeather(weatherMap);
        displayWeather(weatherMap);
      })
      .catch(function(err) {
        console.warn('Erro ao buscar previsão:', err);
      });
  }

  /**
   * Extrai cidades únicas do roteiro
   */
  function getUniqueCities() {
    var seen = {};
    var unique = [];

    Object.keys(CIDADES).forEach(function(date) {
      var city = CIDADES[date];
      var key = city.lat + ',' + city.lon;
      if (!seen[key]) {
        seen[key] = true;
        unique.push(city);
      }
    });

    return unique;
  }

  /**
   * Busca previsão do Open-Meteo
   */
  function fetchWeather(city) {
    var url = 'https://api.open-meteo.com/v1/forecast?' +
      'latitude=' + city.lat +
      '&longitude=' + city.lon +
      '&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
      '&timezone=America/Sao_Paulo' +
      '&start_date=2026-01-19' +
      '&end_date=2026-02-02';

    return fetch(url)
      .then(function(response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json();
      })
      .then(function(data) {
        return {
          city: city,
          data: data
        };
      });
  }

  /**
   * Processa resultados da API em mapa por data
   */
  function processResults(cities, results) {
    var weatherMap = {};

    results.forEach(function(result) {
      if (!result || !result.data || !result.data.daily) return;

      var daily = result.data.daily;
      var cityKey = result.city.lat + ',' + result.city.lon;

      daily.time.forEach(function(date, i) {
        if (!weatherMap[date]) {
          weatherMap[date] = {};
        }

        weatherMap[date][cityKey] = {
          code: daily.weathercode[i],
          max: daily.temperature_2m_max[i],
          min: daily.temperature_2m_min[i],
          precip: daily.precipitation_probability_max[i]
        };
      });
    });

    return weatherMap;
  }

  /**
   * Exibe previsão na tabela e timeline
   */
  function displayWeather(weatherMap) {
    // Adicionar previsão na tabela de resumo
    addWeatherToTable(weatherMap);

    // Adicionar previsão nos day-dots da timeline
    addWeatherToDots(weatherMap);
  }

  /**
   * Adiciona coluna de clima na tabela de resumo
   */
  function addWeatherToTable(weatherMap) {
    var table = document.querySelector('#resumo-tabela table');
    if (!table) return;

    // Adicionar cabeçalho
    var headerRow = table.querySelector('thead tr');
    if (headerRow) {
      var th = document.createElement('th');
      th.textContent = 'Clima';
      th.style.textAlign = 'center';
      headerRow.appendChild(th);
    }

    // Adicionar células de clima
    var rows = table.querySelectorAll('tbody tr');
    rows.forEach(function(row) {
      var diaLink = row.querySelector('.dia-link');
      if (!diaLink) return;

      var dateStr = diaLink.getAttribute('data-date');
      var city = CIDADES[dateStr];
      if (!city) return;

      var cityKey = city.lat + ',' + city.lon;
      var weather = weatherMap[dateStr] && weatherMap[dateStr][cityKey];

      var td = document.createElement('td');
      td.style.textAlign = 'center';
      td.style.fontSize = '1.2em';

      if (weather) {
        var wmoInfo = WMO_CODES[weather.code] || { icon: '❓', desc: 'Desconhecido' };
        td.textContent = wmoInfo.icon;
        td.title = wmoInfo.desc + '\n' +
          'Máx: ' + Math.round(weather.max) + '°C\n' +
          'Mín: ' + Math.round(weather.min) + '°C\n' +
          'Chuva: ' + weather.precip + '%';
        td.className = 'weather-cell';
      } else {
        td.textContent = '—';
        td.title = 'Previsão não disponível';
      }

      row.appendChild(td);
    });
  }

  /**
   * Adiciona badges de clima nos day-dots
   */
  function addWeatherToDots(weatherMap) {
    var dots = document.querySelectorAll('.day-dot[data-date]');

    dots.forEach(function(dot) {
      var dateStr = dot.getAttribute('data-date');
      var city = CIDADES[dateStr];
      if (!city) return;

      var cityKey = city.lat + ',' + city.lon;
      var weather = weatherMap[dateStr] && weatherMap[dateStr][cityKey];

      if (weather) {
        var wmoInfo = WMO_CODES[weather.code] || { icon: '❓', desc: 'Desconhecido' };

        // Adicionar badge de clima
        var badge = document.createElement('span');
        badge.className = 'weather-badge';
        badge.textContent = wmoInfo.icon;
        badge.title = wmoInfo.desc + ' | ' +
          Math.round(weather.min) + '°-' + Math.round(weather.max) + '°C';

        dot.appendChild(badge);

        // Adicionar dados ao preview se existir
        var preview = dot.querySelector('.day-preview');
        if (preview) {
          var weatherLine = document.createElement('div');
          weatherLine.className = 'day-preview-weather';
          weatherLine.textContent = wmoInfo.icon + ' ' +
            Math.round(weather.min) + '°-' + Math.round(weather.max) + '°C';
          preview.appendChild(weatherLine);
        }
      }
    });
  }

  /**
   * Obtém dados do cache se válidos
   */
  function getCachedWeather() {
    try {
      var cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      var parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return parsed.data;
    } catch (e) {
      return null;
    }
  }

  /**
   * Salva dados no cache
   */
  function cacheWeather(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data: data
      }));
    } catch (e) {
      console.warn('Erro ao salvar cache:', e);
    }
  }

  // Inicializar quando DOM estiver pronto
  document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco para não bloquear renderização inicial
    setTimeout(getWeatherData, 500);
  });
})();
