
import { setVal, getVal, reloadDB } from "./src/services/db.service";

async function updateKey() {
    console.log("Reloading DB...");
    await reloadDB();

    const newKey = "AIzaSyBh4hJ7DtY1TMqXDhvKA1wSkehC_rgZZNU";
    console.log("Updating Gemini Key in Database to:", newKey);

    try {
        await setVal("/settings/providers/gemini", newKey);
        console.log("Update Success.");

        const check = await getVal("/settings/providers/gemini");
        console.log("Verification Read:", check);

        if (check === newKey) {
            console.log("KEY UPDATE CONFIRMED.");
        } else {
            console.error("KEY UPDATE FAILED verification.");
        }

    } catch (e: any) {
        console.error("Error updating DB:", e);
    }
}

updateKey();
