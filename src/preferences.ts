export function readPreference(key:string){try{return localStorage.getItem('inversion-ia:'+key)||'';}catch{return '';}}
export function savePreference(key:string,value:string){try{localStorage.setItem('inversion-ia:'+key,value);}catch{/* Browsing still works if storage is unavailable. */}}
