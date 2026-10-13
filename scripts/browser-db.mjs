/** Read the real persisted Verse store from a Playwright page, without modifying it. */
export function poemsIn(page) {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const opened = indexedDB.open("verse-local-poems", 1);
    opened.onerror = () => reject(opened.error);
    opened.onsuccess = () => {
      const db = opened.result;
      let tx;
      try { tx = db.transaction("poems", "readonly"); }
      catch (error) { db.close(); reject(error); return; }
      const get = tx.objectStore("poems").getAll();
      get.onsuccess = () => resolve(get.result);
      get.onerror = () => reject(get.error);
      tx.oncomplete = () => db.close();
    };
  }));
}
