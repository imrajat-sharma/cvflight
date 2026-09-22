import classic from './classic';
import minimal from './minimal';
import engineer from './engineer';
import executive from './executive';
import modern from './modern';
import academic from './academic';
export const templates = [classic,minimal,engineer,executive,modern,academic];
export const getTemplate = (id:string) => templates.find(t=>t.id===id)||classic;
