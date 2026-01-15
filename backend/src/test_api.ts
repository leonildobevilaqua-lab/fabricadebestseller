
import axios from 'axios';

async function testLookup() {
    const email = "contato@leonildobevilaqua.com.br";
    console.log(`Testing lookup for: ${email}`);
    try {
        const res = await axios.post('http://localhost:3001/api/projects/find-id-by-email', { email });
        console.log("Response:", res.data);
    } catch (e: any) {
        console.error("Error:", e.message);
        if (e.response) console.error(e.response.data);
    }
}

testLookup();
