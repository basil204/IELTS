import IeltsConcourseClient from '@/components/IeltsConcourseClient';
import type {
  Listening179Item,
  MyIeltsChapter,
  Reading538Tier,
  TopicStat,
  WordAtlasEntry,
  Writing100Item
} from '@/types/atlas';

import rawPriorityWords from '../../public/data/word-atlas-priority.json';
import rawTopics from '../../public/data/word-atlas-topics.json';
import rawChapters from '../../public/data/my-ielts-chapters.json';
import rawReadingTiers from '../../public/data/my-ielts-reading538.json';
import rawListening179 from '../../public/data/my-ielts-listening179.json';
import rawWriting100 from '../../public/data/my-ielts-writing100.json';

export default function HomePage() {
  const priorityWords = rawPriorityWords as WordAtlasEntry[];
  const topics = rawTopics as TopicStat[];
  const chapters = rawChapters as MyIeltsChapter[];
  const readingTiers = rawReadingTiers as Reading538Tier[];
  const listening179 = rawListening179 as Listening179Item[];
  const writing100 = rawWriting100 as Writing100Item[];

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
