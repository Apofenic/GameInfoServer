import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

async function scrapeWikipediaGamesList(url: string, outputFilename: string) {
  try {
    console.log(`Fetching data from ${url}...`);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    console.log($);

    const games: any[] = [];

    // Most Wikipedia game lists use tables with class 'wikitable'
    $('table.wikitable tr').each((i: any, element: any) => {
      // Skip header row
      if (i === 0) return;

      const $row = $(element);
      const cells = $row.find('td');

      // Adjust these indices based on the specific table structure
      // This example assumes columns: Title, Platform, Release Date, Notes/Score
      if (cells.length >= 3) {
        const title = $(cells[0]).text().trim();
        const platform = $(cells[1]).text().trim();

        // Parse release date - format varies on Wikipedia
        let releaseDate = $(cells[2]).text().trim();
        try {
          // Attempt to create a valid date
          releaseDate = new Date(releaseDate).toISOString();
        } catch (e) {
          // If parsing fails, keep as string
        }

        // Optional: extract metascore if available
        let metascore = 0;
        if (cells.length >= 4) {
          const scoreText = $(cells[3]).text().trim();
          const scoreMatch = scoreText.match(/(\d+)/);
          if (scoreMatch) {
            metascore = parseInt(scoreMatch[0], 10);
          }
        }

        if (title && platform) {
          games.push({
            title,
            platform,
            releaseDate,
            metascore: metascore || 75, // Default score if none found
            summary: `Game from Wikipedia list: ${url}`,
          });
        }
      }
    });

    // Write to JSON file
    const outputPath = path.join(__dirname, '..', 'data', outputFilename);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(games, null, 2));

    console.log(`Successfully scraped ${games.length} games to ${outputPath}`);
    return games;
  } catch (error) {
    console.error('Error scraping Wikipedia:', error);
    return [];
  }
}

// Example usage
async function main() {
  // Example Wikipedia URLs with game lists
  const sources = [
    {
      url: 'https://en.wikipedia.org/wiki/List_of_PlayStation_5_games',
      filename: 'ps5-games.json',
    },
    {
      url: 'https://en.wikipedia.org/wiki/List_of_Nintendo_Switch_games',
      filename: 'switch-games.json',
    },
  ];
  function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  for (const source of sources) {
    await scrapeWikipediaGamesList(source.url, source.filename);
    await delay(3000); // Wait 3 seconds between requests
  }
}

main().catch(console.error);
