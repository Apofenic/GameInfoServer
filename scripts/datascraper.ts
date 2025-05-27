import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { consoleGameListSources, computerGameListSources } from './ScrapingSources';

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
          .map((_i, element) => {
            const rawText = $(element).text().trim();
            const noCitations = rawText.replace(/(\s*\[\d+\])+$/, ''); // Remove trailing citations
            return noCitations.replace(/\s+/g, '_'); // Replace spaces with underscores
          })
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

async function main() {
  const sources = [...consoleGameListSources, ...computerGameListSources];
  function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  for (const source of sources) {
    await scrapeWikipediaGamesList(source.url, source.filename);
    await delay(3000);
  }
}
main().catch(console.error);
