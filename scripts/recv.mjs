import http from 'node:http';
import { writeFile } from 'node:fs/promises';

http
  .createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method !== 'POST') {
      res.end('ok');
      return;
    }
    let b = '';
    req.on('data', (d) => (b += d));
    req.on('end', async () => {
      const data = b.replace(/^data:image\/png;base64,/, '');
      await writeFile('scripts/plate-master.png', Buffer.from(data, 'base64'));
      res.end('saved ' + data.length);
      console.log('saved plate-master.png', data.length);
    });
  })
  .listen(8123, () => console.log('recv on 8123'));
