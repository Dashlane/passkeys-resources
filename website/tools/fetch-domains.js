const fs = require('fs').promises;
const axios = require('axios');
const { JSDOM } = require('jsdom');
const imageSize = require('image-size');

const axiosOptions = {
    timeout: 5000, maxRedirects: 5, validateStatus: function (status) {
        return status >= 200 && status < 300 || status == 403;
    }
};

async function fetchDomainInfo(domain, debug = false) {
    try {
        const protocol = 'https://';
        const url = new URL(domain.startsWith('http') ? domain : protocol + domain);
        const baseUrl = url.origin;

        const response = await axios.get(url.href, axiosOptions);
        const html = response.data;

        const dom = new JSDOM(html);
        const { document } = dom.window;

        const titleElement = document.querySelector('title');
        const title = titleElement ? titleElement.textContent : '';

        const descriptionElement = document.querySelector('meta[name="description"]');
        const description = descriptionElement ? descriptionElement.getAttribute('content') : '';

        const icons = await getIcons(document, baseUrl, debug);

        const bestQualityIcon = await findBestAccessibleIcon(icons, debug);

        return {
            domain, // Add the domain to the output
            name: title,
            description,
            icon: bestQualityIcon,
        };
    } catch (error) {
        if (debug) {
            console.error(`Error fetching domain ${domain}:`, error);
        }
        return null;
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
            const manifestResponse = await axios.get(manifestUrl, axiosOptions);
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
                const { size } = await getIconSize(icon);
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

async function getIconSize(iconUrl) {
    try {
        const response = await axios.get(iconUrl, { responseType: 'arraybuffer', ...axiosOptions });
        const buffer = Buffer.from(response.data, 'binary');
        const dimensions = imageSize(buffer);
        const size = dimensions.width * dimensions.height;
        return { size, width: dimensions.width, height: dimensions.height };
    } catch (error) {
        console.error(`Error retrieving icon size for ${iconUrl}:`, error);
        throw new Error(`Failed to retrieve icon size for ${iconUrl}`);
    }
}

async function processDomains(inputFile, outputFile, debug = false) {
    try {
        const data = await fs.readFile(inputFile, 'utf8');
        const domains = JSON.parse(data);

        const results = [];

        for (const domain of domains) {
            const result = await fetchDomainInfo(domain, debug);
            if (result) {
                results.push(result);
            }
        }

        const jsonOutput = JSON.stringify(results, null, 2);
        await fs.writeFile(outputFile, jsonOutput);
        console.log(`Output written to ${outputFile}`);
    } catch (error) {
        console.error('Error processing domains:', error);
    }
}

// Usage example
const inputFile = '../resources/compatible-domains.json';
const outputFile = 'public/domains.json';
const debug = process.argv.includes('--debug');
processDomains(inputFile, outputFile, debug);
