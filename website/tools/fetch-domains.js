const fs = require('fs').promises;
const axios = require('axios');
const { JSDOM } = require('jsdom');
const imageSize = require('image-size');

const axiosInstance = axios.create();
axiosInstance.defaults.maxRedirects = 0; // Set to 0 to prevent automatic redirects
axiosInstance.defaults.timeout = 1000; // Set to 1 second
axiosInstance.defaults.adapter = 'http';
axiosInstance.defaults.headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';
axiosInstance.defaults.headers['Accept-Encoding'] = 'gzip, deflate, br';
axiosInstance.defaults.headers['Accept-Language'] = 'en-US,en;q=1';
axiosInstance.defaults.headers['Cache-Control'] = 'no-cache';
axiosInstance.interceptors.response.use(
    response => response,
    error => {
        if (error.response && [301, 302].includes(error.response.status)) {
            let redirectUrl = error.response.headers.location;
            if (redirectUrl.startsWith('/')) {
                const { url } = error.response.config;
                redirectUrl = url + redirectUrl;
            }
            console.log('Redirecting to', error.response.headers.location);
            return axiosInstance.get(redirectUrl);
        }
        return Promise.reject(error);
    }
);

const axiosIconsOptions = {
    timeout: 500, maxRedirects: 5, validateStatus: (status) => {
        return status >= 200 && status < 300 || status == 403;
    }
};

async function fetchDomainInfo(domain, debug = false) {
    try {
        const protocol = 'https://';
        const url = new URL(domain.startsWith('http') ? domain : protocol + domain);

        const wwwUrl = new URL(domain.startsWith('http') ? domain : protocol + 'www.' + domain);

        let response;
        try {
            response = await axiosInstance.get(url.href);
        } catch (error) {
            if (debug) {
                console.error('Error in the initial request', error);
            }

            // if the root domain is not accessible we fallback to www.
            response = await axiosInstance.get(wwwUrl.href);
        }

        const html = response.data;

        const dom = new JSDOM(html);
        const { document } = dom.window;

        const titleElement = document.querySelector('title');
        const title = titleElement ? titleElement.textContent : '';

        const descriptionElement = document.querySelector('meta[name="description"]')
            ?? document.querySelector('meta[name="Description"]')
            ?? document.querySelector('meta[property="og:description"]');
        const description = descriptionElement ? descriptionElement.getAttribute('content') : '';

        const icons = await getIcons(document, response.config.url, debug);

        const bestQualityIcon = await findBestAccessibleIcon(icons, debug);

        let iconPath = '';
        // save the icon locally
        if (bestQualityIcon !== null && bestQualityIcon !== '') {
            console.log("Fetching icon from:", bestQualityIcon);
            const response = await axiosInstance.get(bestQualityIcon, { responseType: 'arraybuffer' });
            const fileExtension = bestQualityIcon.split('.').pop();
            // if icon folder does not exist, create it
            fs.access('public/icons').catch(() => {
                fs.mkdir('public/icons');
            });
            iconPath = `icons/${domain}.${fileExtension}`;
            await fs.writeFile(`public/${iconPath}`, response.data);
            if (debug) console.log(`Icon saved to ${iconPath}`);
        }

        const wellKnownEndpoints = await getWellKnownEndpoints(url.hostname, debug);

        return {
            domain, // Add the domain to the output
            name: title,
            description,
            icon: iconPath,
            endpoints: wellKnownEndpoints,
        };
    } catch (error) {
        if (debug) {
            console.error(`Error fetching domain ${domain}:`, error);
        }

        return {
            domain,
            name: '',
            description: '',
            icon: '',
            endpoints: { enroll: '', manage: '' },
        };
    }
}

async function getWellKnownEndpoints(baseUrl, debug = false) {
    const url = `https://${baseUrl}/.well-known/passkey-endpoints`;
    console.log("Fetching passkey endpoints from:", url);
    try {
        const response = await axiosInstance.get(url);
        return { enroll: response.data.enroll ?? '', manage: response.data.manage ?? '' };
    } catch (error) {
        if (debug) {
            console.error(`Error fetching well-known endpoints for domain ${baseUrl}:`, error);
        }
        return { enroll: '', manage: '' };
    }
}

async function getIcons(document, baseUrl, debug = false) {
    const icons = [];

    // Check the default favicon location
    icons.push(new URL('/favicon.ico', baseUrl).href);

    // Check for apple-touch-icon
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (appleTouchIcon) {
        const href = new URL(appleTouchIcon.getAttribute('href'), baseUrl).href;
        icons.push(href);
    }

    // Check for shortcut icon
    const shortcutIcon = document.querySelector('link[rel="shortcut icon"]');
    if (shortcutIcon) {
        const href = new URL(shortcutIcon.getAttribute('href'), baseUrl).href;
        icons.push(href);
    }

    // Check for icons in web app manifest
    const manifestElement = document.querySelector('link[rel="manifest"]');
    if (manifestElement && manifestElement.getAttribute('href')) {
        const manifestUrl = new URL(manifestElement.getAttribute('href'), baseUrl).href;
        try {
            const manifestResponse = await axios.get(manifestUrl, axiosIconsOptions);
            const manifest = manifestResponse.data;
            if (manifest && manifest.icons && Array.isArray(manifest.icons)) {
                for (const icon of manifest.icons) {
                    if (icon.src) {
                        const href = new URL(icon.src, manifestUrl).href;
                        icons.push(href);
                    }
                }
            }
        } catch (error) {
            if (debug) {
                console.error(`Error fetching manifest for domain ${baseUrl}:`, error);
            }
        }
    }

    // Check for other icons, including programmatically injected ones
    const iconElements = Array.from(document.querySelectorAll('link[rel^="icon"]'));
    for (const icon of iconElements) {
        const href = new URL(icon.getAttribute('href'), baseUrl).href;
        icons.push(href);
    }

    return icons;
}

async function findBestAccessibleIcon(icons, debug = false) {
    if (!icons || icons.length === 0) {
        return null;
    }

    let bestIcon = null;
    let bestIconSize = 0;

    for (const icon of icons) {
        try {
            const response = await axios.head(icon);
            if (response.status === 200) {
                const { size } = await getIconSize(icon, debug);
                if (size > bestIconSize) {
                    bestIcon = icon;
                    bestIconSize = size;
                }
            }
        } catch (error) {
            if (debug) {
                console.error(`Error accessing icon ${icon}:`, error);
            }
        }
    }

    // If no accessible icon is found, return the URL of the first icon
    return bestIcon || '';
}

async function getIconSize(iconUrl, debug = false) {
    try {
        const response = await axios.get(iconUrl, { responseType: 'arraybuffer', ...axiosIconsOptions });
        const buffer = Buffer.from(response.data, 'binary');
        const dimensions = imageSize(buffer);
        const size = dimensions.width * dimensions.height;
        return { size, width: dimensions.width, height: dimensions.height };
    } catch (error) {
        if (debug) {
            console.error(`Error retrieving icon size for ${iconUrl}:`, error);
        }
        throw new Error(`Failed to retrieve icon size for ${iconUrl}`);
    }
}

async function processDomains(inputFile, outputFile, debug = false) {
    const data = await fs.readFile(inputFile, 'utf8');
    const domains = JSON.parse(data);

    const results = [];

    for (const domain of domains) {
        const result = await fetchDomainInfo(domain, debug);
        console.log(domain, result);
        if (result) {
            results.push(result);
        }
    }

    const jsonOutput = JSON.stringify(results, null, 2);
    await fs.writeFile(outputFile, jsonOutput);
    console.log(`Output written to ${outputFile}`);
}

const inputFile = '../resources/compatible-domains.json';
const outputFile = 'public/domains.json';
const debug = process.argv.includes('--debug');

(async () => {
    try {
        await processDomains(inputFile, outputFile, debug);
    } catch (error) {
        console.error('Error processing domains:', error);
        process.exit(1);
    }
})();
