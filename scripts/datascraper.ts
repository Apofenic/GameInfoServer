import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

async function scrapeWikipediaGamesList(url: string, outputFilename: string) {
  try {
    console.log(`Fetching data from ${url}...`);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const gameTables = $('table.wikitable')
      .map((tableIndex, tableElement) => {
        console.log(`Processing table #${tableIndex + 1}`);
        const $table = $(tableElement);
        const tableHeaders: string[] = $table
          .find('tr:first-child th')
          .map((i, element) => $(element).text().trim())
          .get();

        if (tableHeaders.length === 0) {
          console.log(`Table #${tableIndex + 1} has no headers, skipping`);
          return;
        }
        const tableCells = $table
          .find('tr:not(:first-child)')
          .map((_i, element) => {
            return [
              $(element)
                .find('td')
                .map((i, cell) => $(cell).text().trim())
                .get(),
            ];
          })
          .get();
        return [
          {
            [`table${tableIndex + 1}`]: tableCells.map((cellsArray) => {
              return cellsArray.reduce((obj: any, value: string, i: number) => {
                return { ...obj, [tableHeaders[i]]: value };
              }, {});
            }, []),
          },
        ];
      })
      .get();
    const outputPath = path.join(__dirname, '..', 'data', outputFilename);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(gameTables, null, 2));
    console.log(`Successfully scraped ${gameTables.length} games to ${outputPath}`);
    return gameTables;
  } catch (error) {
    console.error('Error scraping Wikipedia:', error);
    return [];
  }
}

// Example usage
async function main() {
  // Example Wikipedia URLs with game lists
  const sources = [
    // {
    //   url: 'https://en.wikipedia.org/wiki/List_of_PlayStation_5_games',
    //   filename: 'ps5-games.json',
    // },

    {
      url: 'https://en.wikipedia.org/wiki/List_of_Game_%26_Watch_games',
      filename: 'game-and-watch-games.json',
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
