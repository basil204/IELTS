import fs from 'fs';
import path from 'path';
import IeltsConcourseClient from '@/components/IeltsConcourseClient';
import type {
  Listening179Item,
  MyIeltsChapter,
  Reading538Tier,
  TopicStat,
  WordAtlasEntry,
  Writing100Item
} from '@/types/atlas';

function readJsonFile<T>(relPath: string): T {
  const fullPath = path.join(process.cwd(), relPath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8')) as T;
}

export default function HomePage() {
  const priorityWords = readJsonFile<WordAtlasEntry[]>(
    'public/data/word-atlas-priority.json'
  );
  const topics = readJsonFile<TopicStat[]>('public/data/word-atlas-topics.json');
  const chapters = readJsonFile<MyIeltsChapter[]>(
    'public/data/my-ielts-chapters.json'
  );
  const readingTiers = readJsonFile<Reading538Tier[]>(
    'public/data/my-ielts-reading538.json'
  );
  const listening179 = readJsonFile<Listening179Item[]>(
    'public/data/my-ielts-listening179.json'
  );
  const writing100 = readJsonFile<Writing100Item[]>(
    'public/data/my-ielts-writing100.json'
  );

  return (
    <IeltsConcourseClient
      initialPriorityWords={priorityWords}
      topics={topics}
      chapters={chapters}
      readingTiers={readingTiers}
      listening179={listening179}
      writing100={writing100}
    />
  );
}
