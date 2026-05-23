const fetch = require('node-fetch');

(async () => {
    const url = "https://m.media-amazon.com/images/I/71sh8JtiZbL.jpg";
    const res = await fetch(url);
    console.log(res.status);
})();
