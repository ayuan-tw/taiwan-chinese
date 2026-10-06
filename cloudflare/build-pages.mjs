// Produces a Pages Direct Upload Advanced Mode directory. Does not deploy.
import {spawnSync} from 'node:child_process';
import {cp,copyFile,mkdir,rm,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const tag=process.env.CHENGCI_BUILD_TAG || '';
if(tag && !/^[a-z0-9-]{1,80}$/.test(tag))throw new Error('Invalid isolated build tag');
const suffix=tag?'-'+tag:'';
const built=spawnSync(process.execPath,[fileURLToPath(new URL('./build-assets.mjs',import.meta.url))],{stdio:'inherit'});
if(built.status!==0)process.exit(built.status || 1);
const destination=fileURLToPath(new URL('./pages-public'+suffix+'/',import.meta.url));
await rm(destination,{recursive:true,force:true});
await mkdir(destination,{recursive:true});
await cp(fileURLToPath(new URL('./public'+suffix+'/',import.meta.url)),destination,{recursive:true});
await copyFile(fileURLToPath(new URL('./worker.mjs',import.meta.url)),destination+'_worker.js');
await writeFile(destination+'_routes.json',JSON.stringify({version:1,include:['/*'],exclude:[]},null,2)+'\n');
console.log('Prepared Pages Advanced Mode assets with _worker.js and all-route handling. Sync stays disabled until separately configured. No upload or deployment.');
