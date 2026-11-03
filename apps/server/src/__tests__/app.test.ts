import {createServer} from 'node:http';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {describe,expect,it} from 'vitest';
import {createApp} from '../app.js';

describe('Production same-origin hosting',()=>{
  it('serves the SPA, reports the new duration and does not return HTML for missing assets',async()=>{
    const folder=await mkdtemp(path.join(tmpdir(),'market-hosting-'));
    await writeFile(path.join(folder,'index.html'),'<html>Market Mayhem test</html>');
    const server=createServer(createApp(folder));await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
    const origin=`http://127.0.0.1:${(server.address() as {port:number}).port}`;
    try{
      const health=await(await fetch(origin+'/health')).json();expect(health.matchDurationSeconds).toBe(480);
      const home=await fetch(origin+'/');expect(await home.text()).toContain('Market Mayhem test');
      expect((await fetch(origin+'/assets/missing.js')).status).toBe(404);
      expect(await(await fetch(origin+'/play')).text()).toContain('Market Mayhem test');
    }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));await rm(folder,{recursive:true,force:true});}
  });
});
