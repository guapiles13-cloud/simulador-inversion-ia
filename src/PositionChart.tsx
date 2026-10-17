import {useEffect,useRef,useState} from 'react';
import {PriceChart} from './MarketPage.tsx';
type Point={date:string;close:string;sma20:string|null;sma50:string|null};
const names:Record<string,string>={AAPL:'Apple',MSFT:'Microsoft',GOOGL:'Alphabet',AMZN:'Amazon',IBM:'IBM',SPY:'SPY'};
export function PositionChart({walletId,symbol,date,onClose}:{walletId:string;symbol:string;date:string;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);const [points,setPoints]=useState<Point[]>();const [error,setError]=useState('');
 useEffect(()=>{dialog.current?.showModal();},[]);
 useEffect(()=>{const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);let live=true;
 fetch('/api/wallet/chart?id='+encodeURIComponent(walletId)+'&symbol='+encodeURIComponent(symbol),{signal:controller.signal}).then(async r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{if(live)setPoints(data.chart);}).catch(()=>{if(live)setError('No se pudo cargar la gráfica. Cierra esta ventana y vuelve a pulsar el activo.');}).finally(()=>clearTimeout(timeout));
 return()=>{live=false;clearTimeout(timeout);controller.abort();};},[walletId,symbol,date]);
 return <dialog ref={dialog} className="position-chart-dialog" aria-labelledby="position-chart-title" onCancel={onClose} onClose={onClose}><div className="section-heading"><h2 id="position-chart-title">{names[symbol]||symbol} · {symbol}</h2><button className="secondary-button" onClick={()=>dialog.current?.close()} autoFocus>Cerrar ✕</button></div><p className="analysis-note">Evolución hasta la sesión de tu cartera: {date}. Cierres diarios en dólares; tu resultado en euros también depende de la divisa y los costes.</p>{error?<p role="alert" className="error">{error}</p>:points?<PriceChart points={points}/>:<p role="status">Cargando gráfica…</p>}</dialog>;
}
