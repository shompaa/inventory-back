export const uuid = () => {
    const timestamp = Date.now().toString();
    const randomNum = Math.floor(Math.random() * 1e8).toString().padStart(12 - timestamp.length, "0");
    return timestamp + randomNum;
};