import axios from 'axios';

/**
 * Get weather information for a location
 * Uses OpenWeatherMap API (free tier)
 * @param {string} city - City name
 * @param {string} apiKey - API key (optional, uses demo if not provided)
 * @returns {Promise<Object>} Weather data
 */
export async function getWeather(city = 'London', apiKey = null) {
  try {
    // Using a free weather API that doesn't require key
    const response = await axios.get(`https://wttr.in/${city}?format=j1`, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Task-Tracker-CLI'
      }
    });
    
    if (response.data && response.data.current_condition) {
      const current = response.data.current_condition[0];
      return {
        city,
        temperature: current.temp_C,
        condition: current.weatherDesc[0].value,
        humidity: current.humidity,
        windSpeed: current.windspeedKmph,
        success: true
      };
    }
    
    throw new Error('Invalid weather data received');
  } catch (error) {
    if (error.response) {
      throw new Error(`Weather API error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('Unable to connect to weather service');
    } else {
      throw new Error(`Weather fetch error: ${error.message}`);
    }
  }
}

/**
 * Get motivational quote from an API
 * @returns {Promise<Object>} Quote object
 */
export async function getMotivationalQuote() {
  try {
    const response = await axios.get('https://api.quotable.io/random', {
      timeout: 5000
    });
    
    return {
      text: response.data.content,
      author: response.data.author,
      success: true
    };
  } catch (error) {
    // Fallback quote if API fails
    return {
      text: 'The way to get started is to quit talking and begin doing.',
      author: 'Walt Disney',
      success: false
    };
  }
}

/**
 * Get task suggestions based on weather
 * @param {string} city - City name for weather
 * @returns {Promise<Array>} Array of suggested tasks
 */
export async function getWeatherBasedSuggestions(city = 'London') {
  try {
    const weather = await getWeather(city);
    const suggestions = [];
    
    if (parseInt(weather.temperature) < 10) {
      suggestions.push({
        title: 'Plan indoor activities',
        description: 'Cold weather - perfect for indoor tasks',
        priority: 'low',
        category: 'planning'
      });
    } else if (parseInt(weather.temperature) > 25) {
      suggestions.push({
        title: 'Stay hydrated and take breaks',
        description: 'Hot weather - remember to stay cool',
        priority: 'medium',
        category: 'health'
      });
    }
    
    if (weather.condition.toLowerCase().includes('rain')) {
      suggestions.push({
        title: 'Focus on indoor work tasks',
        description: 'Rainy day - good time for focused work',
        priority: 'high',
        category: 'work'
      });
    } else if (weather.condition.toLowerCase().includes('sun')) {
      suggestions.push({
        title: 'Consider outdoor tasks if any',
        description: 'Sunny day - great for outdoor activities',
        priority: 'medium',
        category: 'outdoor'
      });
    }
    
    return {
      weather,
      suggestions,
      success: true
    };
  } catch (error) {
    return {
      weather: null,
      suggestions: [],
      success: false,
      error: error.message
    };
  }
}

/**
 * Get current date and time information
 * @returns {Object} Date/time info
 */
export function getDateTimeInfo() {
  const now = new Date();
  return {
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString(),
    dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
    hour: now.getHours(),
    isWeekend: now.getDay() === 0 || now.getDay() === 6,
    timestamp: now.toISOString()
  };
}