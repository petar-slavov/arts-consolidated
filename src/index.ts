import { initializeApp } from './init';
import { app } from './app';
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  await initializeApp();
  console.log(`Server running on port ${PORT}`);
});

