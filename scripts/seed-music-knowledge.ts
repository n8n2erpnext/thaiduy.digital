import { seedDefaultMusicKnowledge } from '@/brains/music-sensor/seed'

const result = await seedDefaultMusicKnowledge()
console.log(JSON.stringify(result))
process.exit(0)
