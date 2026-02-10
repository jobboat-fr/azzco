const axios = require('axios');

const IPAPI_API_KEY = process.env.IPAPI_API_KEY || '';
const IPAPI_BASE_URL = 'https://api.ipapi.com/api';

/**
 * Service for IP geolocation using ipapi.com
 * Documentation: https://ipapi.com/documentation
 */
class GeolocationService {
    /**
     * Get geolocation data for an IP address
     * @param {string} ipAddress - IP address to geolocate
     * @returns {Promise<Object>} Geolocation data
     */
    async getLocation(ipAddress) {
        if (!IPAPI_API_KEY) {
            console.warn('IPAPI_API_KEY not configured, skipping geolocation');
            return null;
        }

        // Skip localhost/private IPs
        if (!ipAddress || 
            ipAddress === '::1' || 
            ipAddress === '127.0.0.1' ||
            ipAddress.startsWith('192.168.') ||
            ipAddress.startsWith('10.') ||
            ipAddress.startsWith('172.')) {
            return null;
        }

        try {
            const url = `${IPAPI_BASE_URL}/${ipAddress}?access_key=${IPAPI_API_KEY}`;
            
            const response = await axios.get(url, {
                timeout: 5000,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.data && response.data.error) {
                console.error('IPAPI Error:', response.data.error);
                return null;
            }

            // Map ipapi.com response to our format
            return {
                country: response.data.country_name || response.data.country_code || null,
                countryCode: response.data.country_code || null,
                region: response.data.region_name || response.data.region_code || null,
                regionCode: response.data.region_code || null,
                city: response.data.city || null,
                latitude: response.data.latitude || null,
                longitude: response.data.longitude || null,
                timezone: response.data.time_zone?.id || null,
                currency: response.data.currency?.code || null,
                isp: response.data.connection?.isp || null,
                asn: response.data.connection?.asn || null,
                organization: response.data.connection?.org || null,
                language: response.data.location?.languages?.[0]?.code || null,
                raw: response.data // Store full response for future use
            };
        } catch (error) {
            console.error('Geolocation error:', error.message);
            return null;
        }
    }

    /**
     * Get geolocation for visitor's IP (from request)
     * @param {Object} req - Express request object
     * @returns {Promise<Object>} Geolocation data
     */
    async getLocationFromRequest(req) {
        // Extract IP address from request
        const ipAddress = req.ip || 
                         req.connection.remoteAddress || 
                         req.headers['x-forwarded-for']?.split(',')[0] ||
                         req.headers['x-real-ip'] ||
                         '';

        return this.getLocation(ipAddress);
    }

    /**
     * Enrich visitor data with geolocation
     * @param {Object} visitorData - Visitor data object
     * @param {Object} req - Express request object (optional)
     * @returns {Promise<Object>} Enriched visitor data
     */
    async enrichVisitorData(visitorData, req = null) {
        let ipAddress = visitorData.ipAddress;
        
        if (!ipAddress && req) {
            ipAddress = req.ip || 
                       req.connection.remoteAddress || 
                       req.headers['x-forwarded-for']?.split(',')[0] ||
                       req.headers['x-real-ip'] ||
                       '';
        }

        if (!ipAddress) {
            return visitorData;
        }

        const location = await this.getLocation(ipAddress);
        
        if (location) {
            return {
                ...visitorData,
                country: location.country || visitorData.country,
                countryCode: location.countryCode,
                region: location.region || visitorData.region,
                city: location.city || visitorData.city,
                timezone: location.timezone,
                latitude: location.latitude,
                longitude: location.longitude,
                isp: location.isp,
                language: location.language || visitorData.language
            };
        }

        return visitorData;
    }
}

module.exports = new GeolocationService();
