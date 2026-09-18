/**
 * Inline bootstrap for live clocks (see Next.js "Preventing flash before
 * hydration"). Rendered once in <head>; each <LiveTime> emits a tiny inline
 * call that fills its text synchronously during HTML parsing, so the real
 * time is visible on first paint with no placeholder flash and no hydration
 * mismatch (the element uses suppressHydrationWarning).
 *
 * The formatting here must stay byte-identical to lib/time/format.ts and
 * lib/clock/format-kind.ts — enforced by lib/clock/bootstrap.test.ts.
 */
import { ZONE_ALIASES } from '@/lib/time/aliases';
import { HOUR_CYCLE_STORAGE_KEY } from './constants';

export const CLOCK_BOOTSTRAP_SCRIPT = `(function(){
var W=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
WS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
M=["January","February","March","April","May","June","July","August","September","October","November","December"],
MS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],C={};
function F(z){var k=z||"";if(!C[k]){var o={hourCycle:"h23",year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric"};if(z)o.timeZone=z;C[k]=new Intl.DateTimeFormat("en-US",o)}return C[k]}
function P(ms,z){var x=z&&/^UTC([+-])(\\d{2}):(\\d{2})$/.exec(z);if(x){var o=(x[1]==="-"?-1:1)*(+x[2]*60+ +x[3]),d0=new Date(Math.floor(ms/1000)*1000+o*60000);return{year:d0.getUTCFullYear(),month:d0.getUTCMonth()+1,day:d0.getUTCDate(),hour:d0.getUTCHours(),minute:d0.getUTCMinutes(),second:d0.getUTCSeconds(),weekday:d0.getUTCDay()}}var r={},a=F(z).formatToParts(ms);for(var i=0;i<a.length;i++){if(a[i].type!=="literal")r[a[i].type]=+a[i].value}r.hour=r.hour%24;var d=new Date(0);d.setUTCFullYear(r.year,r.month-1,r.day);r.weekday=d.getUTCDay();return r}
function T(n){return(n<10?"0":"")+n}
function Y(){try{return localStorage.getItem(${JSON.stringify(HOUR_CYCLE_STORAGE_KEY)})==="24h"?"24h":"12h"}catch(e){return"12h"}}
function H(r,s,h){var t=s?":"+T(r.second):"";if(h==="24h")return T(r.hour)+":"+T(r.minute)+t;return(r.hour%12||12)+":"+T(r.minute)+t+" "+(r.hour<12?"AM":"PM")}
function O(ms,z){var s=Math.floor(ms/1000)*1000,r=P(s,z),d=new Date(0);d.setUTCFullYear(r.year,r.month-1,r.day);d.setUTCHours(r.hour,r.minute,r.second,0);var m=Math.round((d.getTime()-s)/60000),a=Math.abs(m),mm=a%60;return"UTC"+(m<0?"-":"+")+Math.floor(a/60)+(mm?":"+T(mm):"")}
function Z(z){var id=z||F().resolvedOptions().timeZone||"UTC";id=${JSON.stringify(ZONE_ALIASES)}[id]||id;var p=id.split("/");return p[p.length-1].replace(/_/g," ")}
function fmt(ms,z,k,h){var r=P(ms,z);switch(k){
case"time":return H(r,true,h);
case"time-short":return H(r,false,h);
case"date-full":return W[r.weekday]+", "+M[r.month-1]+" "+r.day+", "+r.year;
case"date-medium":return WS[r.weekday]+", "+MS[r.month-1]+" "+r.day+", "+r.year;
case"date-weekday-short":return WS[r.weekday]+", "+MS[r.month-1]+" "+r.day;
case"offset":return O(ms,z);
case"zone-city":return Z(z)}
return""}
window.__tn={fmt:fmt,cycle:Y,fill:function(id){var e=document.getElementById(id);if(e)e.textContent=fmt(Date.now(),e.getAttribute("data-tz")||void 0,e.getAttribute("data-kind"),Y())}};
})();`;

/** Per-element call emitted right after a live element. */
export function clockFillScript(id: string): string {
  return `window.__tn&&window.__tn.fill(${JSON.stringify(id)})`;
}
