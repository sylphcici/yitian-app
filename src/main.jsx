import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  CalendarDays,
  Camera,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  Home,
  ImagePlus,
  Images,
  Hash,
  Lock,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Search,
  Smile,
  Sparkles,
  Archive,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import rainyCommute from './assets/rainy-commute.webp';
import yongqingfangAfterRain from './assets/yongqingfang-after-rain.webp';
import dongshankouTheatre from './assets/dongshankou-theatre.webp';
import './styles.css';
import { databaseEnabled, supabase } from './lib/supabase';
import {
  archiveDatabaseMoment,
  createMoment,
  deleteDatabaseMoment,
  loadDatabaseMoments,
  loadResonanceNotifications,
  markDatabaseResonanceRead,
  setDatabaseReaction,
  updateDatabaseMoment,
} from './services/moments';
import { loadReplyThreads, markDatabaseThreadRead, sendDatabaseReply } from './services/replies';
import { getProfileAvatarUrl, saveProfileToDatabase } from './services/profile';
import { loadDatabaseDrafts, saveDatabaseDrafts } from './services/drafts';
import { deleteRecommendationFeedback, loadRecommendationFeedback, saveRecommendationFeedback } from './services/feedback';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

let stableViewportHeight = window.visualViewport?.height || window.innerHeight;

function syncViewportHeight() {
  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  if (viewportHeight > stableViewportHeight) stableViewportHeight = viewportHeight;
  const activeElement = document.activeElement;
  const textInputFocused = activeElement?.matches?.('input:not([type="button"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]');
  const keyboardVisible = window.innerWidth < 700 && (viewportHeight < stableViewportHeight * 0.88 || textInputFocused);
  document.documentElement.style.setProperty('--app-height', `${Math.round(viewportHeight)}px`);
  document.documentElement.classList.toggle('keyboard-visible', keyboardVisible);
}

function resetViewportHeight() {
  stableViewportHeight = window.visualViewport?.height || window.innerHeight;
  syncViewportHeight();
}

syncViewportHeight();
window.addEventListener('resize', syncViewportHeight);
window.addEventListener('orientationchange', () => window.setTimeout(resetViewportHeight, 180));
window.visualViewport?.addEventListener('resize', syncViewportHeight);
document.addEventListener('focusin', syncViewportHeight);
document.addEventListener('focusout', () => window.setTimeout(syncViewportHeight, 80));

function getLocalProfile(userId) {
  try {
    const profile = JSON.parse(window.localStorage.getItem(`yitian-profile:${userId}`) || 'null');
    return profile || { name: '林间', avatar: '' };
  } catch {
    return { name: '林间', avatar: '' };
  }
}
const prototypeNow = Date.now();

const initialMoments = [
  {
    id: 1,
    userId: 'mock-xiaoman',
    user: '小满',
    avatar: '满',
    city: '广州·天河',
    matchCity: '广州',
    createdAt: prototypeNow - HOUR_MS,
    expiresAt: prototypeNow + 23 * HOUR_MS,
    mood: '有点疲惫',
    text: '下班后的雨，好像把一天的声音都关小了。',
    tags: ['刚下班', '雨天', '独处'],
    reactions: 23,
    image: rainyCommute,
    imageAlt: '雨天通勤路上的窗外',
    color: '#e47754',
  },
  {
    id: 2,
    userId: 'mock-island',
    user: '岛屿来信',
    avatar: '岛',
    city: '广州·海珠',
    matchCity: '广州',
    createdAt: prototypeNow - 4 * HOUR_MS,
    expiresAt: prototypeNow + 20 * HOUR_MS,
    mood: '很轻松',
    text: '终于交完了这周最难的一份作业，去操场走两圈。',
    tags: ['校园', '完成一件事'],
    reactions: 17,
    color: '#4a8f75',
  },
  {
    id: 3,
    userId: 'mock-orange',
    user: '阿橘',
    avatar: '橘',
    city: '广州·越秀',
    matchCity: '广州',
    createdAt: prototypeNow - 14 * HOUR_MS,
    expiresAt: prototypeNow + 10 * HOUR_MS,
    mood: '期待',
    text: '第一次给喜欢的乐队拍现场，快要进场了。',
    tags: ['音乐现场', '第一次'],
    reactions: 31,
    color: '#6c73a8',
  },
  {
    id: 4,
    userId: 'mock-southwind',
    user: '南风',
    avatar: '风',
    city: '广州·荔湾',
    matchCity: '广州',
    createdAt: prototypeNow - 90 * 60 * 1000,
    expiresAt: prototypeNow + 22.5 * HOUR_MS,
    mood: '疲惫',
    text: '从西关慢慢走到永庆坊，雨停以后终于有一点风。',
    tags: ['雨天通勤', '在路上'],
    reactions: 12,
    image: yongqingfangAfterRain,
    imageAlt: '雨后的永庆坊街道',
    color: '#56859a',
  },
  {
    id: 5,
    userId: 'mock-kapok',
    user: '木棉',
    avatar: '棉',
    city: '广州·海珠',
    matchCity: '广州',
    createdAt: prototypeNow - 5 * HOUR_MS,
    expiresAt: prototypeNow + 19 * HOUR_MS,
    mood: '平静',
    text: '一个人在江边坐了一会儿，今天不想赶着做任何事。',
    tags: ['独处', '一个人也很好'],
    reactions: 28,
    color: '#8a715c',
  },
  {
    id: 6,
    userId: 'mock-mist',
    user: '阿岚',
    avatar: '岚',
    city: '广州·越秀',
    matchCity: '广州',
    createdAt: prototypeNow - 14 * HOUR_MS,
    expiresAt: prototypeNow + 10 * HOUR_MS,
    mood: '期待',
    text: '第一次去东山口的小剧场，开场前还有一点紧张。',
    tags: ['第一次', '音乐现场'],
    reactions: 19,
    image: dongshankouTheatre,
    imageAlt: '东山口小剧场开场前',
    color: '#8a6684',
  },
  {
    id: 7,
    userId: 'mock-nightowl',
    user: '迟迟',
    avatar: '迟',
    city: '广州·番禺',
    matchCity: '广州',
    createdAt: prototypeNow - 3 * HOUR_MS,
    expiresAt: prototypeNow + 21 * HOUR_MS,
    mood: '开心',
    text: '晚饭后把搁置很久的书读完了一章。',
    tags: ['阅读'],
    reactions: 8,
    color: '#677b68',
  },
  {
    id: 8,
    userId: 'mock-sugar',
    user: '小禾',
    avatar: '禾',
    city: '佛山·禅城',
    matchCity: '',
    createdAt: prototypeNow - 14 * HOUR_MS,
    expiresAt: prototypeNow + 10 * HOUR_MS,
    mood: '未标记',
    text: '又改完一版简历，希望这次能更接近想去的方向。',
    tags: ['秋招进行时'],
    reactions: 6,
    color: '#9a7259',
  },
];

function loadSampleMoments() {
  try {
    const storedTimes = JSON.parse(window.localStorage.getItem('yitian-sample-moment-times-v2') || 'null');
    const hasActiveSample = storedTimes && Object.values(storedTimes).some((timing) => timing.expiresAt > Date.now());
    if (hasActiveSample) {
      return initialMoments.map((moment) => {
        const timing = storedTimes[String(moment.id)];
        return timing ? { ...moment, createdAt: timing.createdAt, expiresAt: timing.expiresAt, isDemo: true } : { ...moment, isDemo: true };
      });
    }
    const times = Object.fromEntries(initialMoments.map((moment) => [String(moment.id), { createdAt: moment.createdAt, expiresAt: moment.expiresAt }]));
    window.localStorage.setItem('yitian-sample-moment-times-v2', JSON.stringify(times));
    return initialMoments.map((moment) => ({ ...moment, isDemo: true }));
  } catch {
    return initialMoments.map((moment) => ({ ...moment, isDemo: true }));
  }
}

const accountMemorySamples = {
  夏夏: [
    { id: 'demo-memory-xiaxia-2026-08', createdAt: new Date(2026, 7, 18, 19, 20).getTime(), text: '雨停以后绕着小区走了一圈，空气里还有潮湿的味道。', mood: '平静', tags: ['雨天', '散步'], reactions: 12 },
    { id: 'demo-memory-xiaxia-2026-07', createdAt: new Date(2026, 6, 12, 18, 35).getTime(), text: '下班后没有急着回家，在江边坐到天色慢慢暗下来。', mood: '放松', tags: ['刚下班', '独处'], reactions: 8 },
  ],
  晓章: [
    { id: 'demo-memory-xiaozhang-2026-08', createdAt: new Date(2026, 7, 23, 21, 10).getTime(), text: '终于把作品集最难改的一页整理清楚了，今晚可以早点休息。', mood: '有成就感', tags: ['校招', '完成一件事'], reactions: 15 },
    { id: 'demo-memory-xiaozhang-2026-07', createdAt: new Date(2026, 6, 9, 15, 40).getTime(), text: '一个人逛完书店，挑到了一本想读很久的书。', mood: '开心', tags: ['独处', '阅读'], reactions: 6 },
  ],
  小红: [
    { id: 'demo-memory-xiaohong-2026-08', createdAt: new Date(2026, 7, 27, 8, 45).getTime(), text: '早上出门时下起小雨，公交车窗把整座城市变得很安静。', mood: '平静', tags: ['下雨', '在路上'], reactions: 11 },
    { id: 'demo-memory-xiaohong-2026-07', createdAt: new Date(2026, 6, 16, 22, 5).getTime(), text: '投出了第一份认真准备的简历，紧张，但也有一点期待。', mood: '期待', tags: ['校招', '第一次'], reactions: 9 },
  ],
};

function loadAccountMemorySamples(userId) {
  const profile = getLocalProfile(userId);
  return (accountMemorySamples[profile.name] || []).map((moment) => ({
    ...moment,
    userId,
    user: profile.name,
    avatar: profile.name.slice(0, 1),
    avatarUrl: profile.avatar || '',
    city: '广州',
    matchCity: '广州',
    expiresAt: moment.createdAt + DAY_MS,
    archivedAt: moment.createdAt + DAY_MS,
    color: '#d95f45',
    images: [],
    image: null,
    hasPhoto: false,
    visibility: '同频的人',
    location: '不展示位置',
    isMine: true,
    isDemo: true,
    persisted: false,
  }));
}

const defaultViewerContext = {
  mood: '有点疲惫',
  tags: ['刚下班', '雨天', '独处', '完成一件事', '第一次'],
  city: '广州',
};

const moodGroups = [
  ['平静', '放松', '很轻松', '踏实'],
  ['开心', '兴奋', '有成就感'],
  ['疲惫', '有点疲惫', '低落', '难过'],
  ['期待', '紧张', '紧张期待'],
];

const relatedTopicGroups = [
  ['刚下班', '下班后的生活', '今天辛苦了'],
  ['下雨', '雨天', '雨天通勤', '在路上'],
  ['独处', '一个人也很好'],
  ['治愈', '散步', '放空', '慢慢生活'],
  ['校园', '完成一件事', '秋招进行时', '校招'],
  ['第一次', '音乐现场'],
];

function canonicalCity(city = '') {
  if (!city || city === '不展示位置') return '';
  return city.split(/[·・]/)[0];
}

function moodScore(viewerMood, candidateMood) {
  if (!viewerMood || !candidateMood) return 0;
  if (viewerMood === '未标记' || candidateMood === '未标记') return 0;
  if (viewerMood === candidateMood) return 3;
  return moodGroups.some((group) => group.includes(viewerMood) && group.includes(candidateMood)) ? 2 : 0;
}

function topicScore(viewerTags = [], candidateTags = []) {
  const exactMatches = candidateTags.filter((tag) => viewerTags.includes(tag));
  if (exactMatches.length) return { score: 3, exactMatches, related: false };
  const related = relatedTopicGroups.some((group) =>
    viewerTags.some((tag) => group.includes(tag)) && candidateTags.some((tag) => group.includes(tag)),
  );
  return { score: related ? 2 : 0, exactMatches: [], related };
}

function timeScore(createdAt, now) {
  const age = Math.max(0, now - createdAt);
  if (age <= 6 * HOUR_MS) return 3;
  if (age <= 12 * HOUR_MS) return 2;
  if (age <= 24 * HOUR_MS) return 1;
  return 0;
}

function relativeTime(createdAt, now = Date.now()) {
  const hours = Math.floor(Math.max(0, now - createdAt) / HOUR_MS);
  if (hours === 0) return '刚刚';
  return `${hours}小时前`;
}

function remainingTime(expiresAt, now = Date.now()) {
  const remaining = Math.max(0, expiresAt - now);
  const hours = Math.floor(remaining / HOUR_MS);
  const minutes = Math.floor((remaining % HOUR_MS) / 60000);
  return `${hours}小时${minutes.toString().padStart(2, '0')}分`;
}

function scoreMoment(moment, viewer, now) {
  if (moment.isMine) return { ...moment, match: '我的此刻', matchLevel: 'own', matchScore: null, isRecommended: true, reasons: [], visibleReasons: [], scoreBreakdown: null };
  const mood = moodScore(viewer.mood, moment.mood);
  const topic = topicScore(viewer.tags, moment.tags);
  const time = timeScore(moment.createdAt, now);
  const viewerCity = canonicalCity(Object.prototype.hasOwnProperty.call(viewer, 'matchCity') ? viewer.matchCity : viewer.city);
  const candidateCity = canonicalCity(Object.prototype.hasOwnProperty.call(moment, 'matchCity') ? moment.matchCity : moment.city);
  const location = viewerCity && candidateCity && viewerCity === candidateCity ? 1 : 0;
  const score = mood + topic.score + time + location;
  const isRecommended = mood > 0 || topic.score > 0;
  const matchLevel = !isRecommended ? 'none' : score >= 7 ? 'high' : score >= 4 ? 'medium' : 'light';
  const match = matchLevel === 'high' ? '高度同频' : matchLevel === 'medium' ? '中度同频' : matchLevel === 'light' ? '轻度同频' : '';
  const reasons = [];
  const visibleReasons = [];
  if (mood === 3) visibleReasons.push('同一心情');
  else if (mood === 2) visibleReasons.push('心情相近');
  if (topic.exactMatches.length) visibleReasons.push(`${topic.exactMatches.length}个共同话题`);
  else if (topic.related) visibleReasons.push('话题相近');
  reasons.push(...visibleReasons);
  if (time > 0) reasons.push(relativeTime(moment.createdAt, now));
  if (location) reasons.push('都在广州');
  return { ...moment, match, matchLevel, matchScore: score, isRecommended, reasons, visibleReasons, scoreBreakdown: { mood, topic: topic.score, time, location } };
}

function scoreMomentAgainstContexts(moment, viewerContexts, now) {
  if (moment.isMine) return scoreMoment(moment, viewerContexts[0] || defaultViewerContext, now);
  if (!viewerContexts.length) return scoreMoment(moment, defaultViewerContext, now);
  const comparisons = viewerContexts.map((viewer) => ({ ...scoreMoment(moment, viewer, now), matchedMomentId: viewer.id, matchedViewer: viewer }));
  const eligibleComparisons = comparisons.filter((comparison) => comparison.isRecommended);
  const candidates = eligibleComparisons.length ? eligibleComparisons : comparisons;
  return candidates.reduce((best, current) => current.matchScore > best.matchScore ? current : best);
}

function topicsAreRelated(first, second) {
  return relatedTopicGroups.some((group) => group.includes(first) && group.includes(second));
}

function feedbackWeightFor(moment, feedback, sourceMoments, reacted, replyThreads, now) {
  let negativeWeight = 0;
  const negativeReasons = [];
  feedback.forEach((item) => {
    if (item.feedbackType === 'topic' && item.topic) {
      if (moment.tags?.includes(item.topic)) {
        negativeWeight -= 3;
        negativeReasons.push({ label: `减少 #${item.topic}`, weight: -3 });
      } else if (moment.tags?.some((tag) => topicsAreRelated(item.topic, tag))) {
        negativeWeight -= 1;
        negativeReasons.push({ label: `相关话题降权`, weight: -1 });
      }
    }
    if (item.feedbackType === 'mood' && item.mood === moment.mood) {
      negativeWeight -= 2;
      negativeReasons.push({ label: `减少“${item.mood}”心情`, weight: -2 });
    }
    if (item.feedbackType === 'repeat' && (!item.expiresAt || item.expiresAt > now) && moment.tags?.includes(item.topic)) {
      negativeWeight -= 1;
      negativeReasons.push({ label: `#${item.topic} 内容重复`, weight: -1 });
    }
  });

  let resonanceWeight = 0;
  let replyWeight = 0;
  const positiveTopics = new Set();
  sourceMoments.forEach((source) => {
    const matchingTopics = source.tags?.filter((tag) => moment.tags?.includes(tag)) || [];
    if (!matchingTopics.length) return;
    matchingTopics.forEach((tag) => positiveTopics.add(tag));
    if (reacted.includes(source.id)) resonanceWeight += 2;
    const responded = replyThreads.some((thread) => thread.momentId === source.id && thread.messages.some((message) => message.sender === 'me'));
    if (responded) replyWeight += 3;
  });
  const rawPositiveWeight = resonanceWeight + replyWeight;
  const positiveWeight = Math.min(5, rawPositiveWeight);
  const appliedNegativeWeight = Math.max(-5, negativeWeight);
  return {
    total: appliedNegativeWeight + positiveWeight,
    positiveWeight,
    negativeWeight: appliedNegativeWeight,
    resonanceWeight,
    replyWeight,
    positiveTopics: [...positiveTopics],
    negativeReasons,
    positiveCapped: rawPositiveWeight > positiveWeight,
    negativeCapped: negativeWeight < appliedNegativeWeight,
  };
}

const moods = ['平静', '开心', '疲惫', '期待', '低落'];
const quickTags = ['刚下班', '独处', '雨天', '在路上', '完成一件事', '第一次'];
const topicSuggestions = [
  { name: '刚下班', count: '2,318 个此刻' },
  { name: '下班后的生活', count: '1,642 个此刻' },
  { name: '一个人也很好', count: '986 个此刻' },
  { name: '雨天通勤', count: '721 个此刻' },
  { name: '今天辛苦了', count: '3,106 个此刻' },
  { name: '秋招进行时', count: '1,284 个此刻' },
];
const locationOptions = [
  { name: '不展示位置', type: '隐私优先', detail: '不会显示任何位置信息', distance: '' },
  { name: '广州', type: '城市', detail: '仅展示城市，不显示具体地点', distance: '' },
  { name: '花城广场', type: '公共空间', detail: '天河区珠江新城', distance: '420m' },
  { name: '广州图书馆', type: '文化场馆', detail: '天河区珠江东路', distance: '650m' },
  { name: '广东省博物馆', type: '文化场馆', detail: '天河区珠江东路', distance: '780m' },
  { name: '海心沙亚运公园', type: '公共空间', detail: '天河区临江大道', distance: '1.1km' },
  { name: '东山口', type: '街区', detail: '越秀区庙前西街附近', distance: '3.8km' },
];

const initialReplyThreads = [
  {
    id: 'mock-thread-xiaoman',
    momentId: 'my-rainy-evening',
    otherId: 'mock-xiaoman',
    user: '小满',
    avatar: '满',
    color: '#e47754',
    source: '下班路上淋了一场雨，回到家才终于松下来。',
    sourceOwner: 'me',
    expiresAt: prototypeNow + 18 * HOUR_MS,
    unread: true,
    persisted: false,
    messages: [{ id: 'mock-reply-1', body: '我也刚到家，雨天通勤真的很消耗。', sender: 'them', createdAt: prototypeNow - 2 * 60 * 1000 }],
  },
  {
    id: 'mock-thread-island',
    momentId: 'my-portfolio-night',
    otherId: 'mock-island',
    user: '岛屿来信',
    avatar: '岛',
    color: '#4a8f75',
    source: '作品集改到第三版，今晚先允许自己停一停。',
    sourceOwner: 'me',
    expiresAt: prototypeNow + 12 * HOUR_MS,
    unread: true,
    persisted: false,
    messages: [{ id: 'mock-reply-2', body: '作品集做到这里已经很不容易了。', sender: 'them', createdAt: prototypeNow - 18 * 60 * 1000 }],
  },
];

function isSeededReplyThread(thread) {
  return thread.id === 'mock-thread-xiaoman' || thread.id === 'mock-thread-island';
}

const topicPattern = /#([^#\s，。！？,.!?]+)/g;

function extractTopics(text) {
  return [...text.matchAll(topicPattern)].map((match) => match[1]);
}

function HighlightedText({ text }) {
  const parts = [];
  let cursor = 0;
  for (const match of text.matchAll(topicPattern)) {
    if (match.index > cursor) parts.push(<React.Fragment key={`text-${cursor}`}>{text.slice(cursor, match.index)}</React.Fragment>);
    parts.push(<span className="inline-topic" key={`topic-${match.index}`}>{match[0]}</span>);
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parts.push(<React.Fragment key={`text-${cursor}`}>{text.slice(cursor)}</React.Fragment>);
  return parts;
}

function MomentImages({ moment, className = 'moment-gallery' }) {
  const images = moment.images?.length ? moment.images : (moment.image ? [moment.image] : []);
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef(null);
  if (!images.length) return null;
  const goToImage = (index) => {
    const nextIndex = Math.max(0, Math.min(images.length - 1, index));
    setActiveIndex(nextIndex);
    trackRef.current?.scrollTo({ left: trackRef.current.clientWidth * nextIndex, behavior: 'smooth' });
  };
  return (
    <div className={`${className} ${images.length > 1 ? 'multiple' : ''}`}>
      <div className="gallery-track" ref={trackRef} onScroll={(event) => setActiveIndex(Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth))}>
        {images.map((src, index) => <img key={`${src.slice(0, 40)}-${index}`} src={src} loading="lazy" decoding="async" alt={`${moment.imageAlt || '此刻的配图'}${images.length > 1 ? ` ${index + 1}` : ''}`} />)}
      </div>
      {images.length > 1 && <>
        <span className="gallery-count">{activeIndex + 1}/{images.length}</span>
        {activeIndex > 0 && <button className="gallery-arrow previous" onClick={() => goToImage(activeIndex - 1)} aria-label="查看上一张图片"><ChevronLeft size={19} /></button>}
        {activeIndex < images.length - 1 && <button className="gallery-arrow next" onClick={() => goToImage(activeIndex + 1)} aria-label="查看下一张图片"><ChevronRight size={19} /></button>}
        <div className="gallery-dots">{images.map((_, index) => <i className={index === activeIndex ? 'active' : ''} key={index} />)}</div>
      </>}
    </div>
  );
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function memoryPreview(text, tags = []) {
  const inlineTopics = extractTopics(text);
  const cleanText = text
    .replace(topicPattern, '')
    .replace(/[ \t]+([，。！？,.!?])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  return {
    text: cleanText,
    topics: [...new Set([...inlineTopics, ...tags])].slice(0, 2),
  };
}

function Avatar({ moment, small = false }) {
  return (
    <div className={`avatar ${small ? 'avatar-small' : ''}`} style={{ background: moment.color }}>
      {moment.avatarUrl ? <img src={moment.avatarUrl} alt={`${moment.user}的头像`} /> : moment.avatar}
    </div>
  );
}

function MessageAvatar({ person, unread = false }) {
  return <div className="message-avatar" style={{ background: person.color }}>{person.avatarUrl ? <img src={person.avatarUrl} alt={`${person.user}的头像`} /> : person.avatar}{unread && <span />}</div>;
}

function StatusRing({ value = 75 }) {
  return <span className="status-ring" style={{ '--progress': `${value * 3.6}deg` }} />;
}

function MomentCard({ moment, reacted, responded, replyCount, onReact, onReply, onEdit, onArchive, onDelete, onFeedback, debugMode, onExplain }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const inlineTopics = extractTopics(moment.text);
  const remainingTags = moment.tags.filter((tag) => !inlineTopics.includes(tag));
  return (
    <article className="moment-card">
      <div className="card-head">
        <Avatar moment={moment} />
        <div className="identity">
          <strong>{moment.user}{moment.isEdited && <small className="edited-mark"> · 已编辑</small>}</strong>
          <span><MapPin size={12} />{moment.city} · {relativeTime(moment.createdAt)}</span>
        </div>
        <div className="card-meta-actions">
          {moment.matchLevel !== 'none' && <button
            className={`match-pill ${debugMode && !moment.isMine ? 'debug-enabled' : ''}`}
            data-level={moment.matchLevel}
            title={moment.matchScore === null ? '这是你发布的内容' : `同频分 ${moment.matchScore}/10：${moment.reasons.join('、')}`}
            disabled={!debugMode || moment.isMine}
            onClick={() => debugMode && !moment.isMine && onExplain(moment)}
          >
            <Sparkles size={12} />{moment.match}
          </button>}
          <button className="moment-menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label={moment.isMine ? '管理这条此刻' : '内容反馈'}><MoreHorizontal size={19} /></button>
        </div>
      </div>

      {menuOpen && (
        <div className="moment-menu">
          {moment.isMine ? <>
            <button onClick={() => { setMenuOpen(false); onEdit(moment); }}><Pencil size={16} />编辑此刻</button>
            <button onClick={() => { setMenuOpen(false); onArchive(moment); }}><Archive size={16} />提前归档</button>
            <button className="danger" onClick={() => { setMenuOpen(false); onDelete(moment); }}><Trash2 size={16} />删除记录</button>
          </> : <>
            <button onClick={() => { setMenuOpen(false); onFeedback(moment, 'hide_moment'); }}><X size={16} />不感兴趣</button>
            <button onClick={() => { setMenuOpen(false); onFeedback(moment, 'hide_user'); }}><UserRound size={16} />不看该用户</button>
          </>}
        </div>
      )}

      <p className="moment-text"><HighlightedText text={moment.text} /></p>
      <MomentImages moment={moment} />

      {remainingTags.length > 0 && (
        <div className="tag-row">
          {remainingTags.map((tag) => <span key={tag}>#{tag}</span>)}
        </div>
      )}

      {moment.visibleReasons?.length > 0 && (
        <div className="match-reason">{moment.visibleReasons.join(' · ')}</div>
      )}

      <div className="expire-row">
        <div>
          <StatusRing value={Math.max(0, Math.round(((moment.expiresAt - Date.now()) / DAY_MS) * 100))} />
          <span>{remainingTime(moment.expiresAt)} 后{moment.isMine ? '进入回声' : '结束展示'}</span>
        </div>
        <span className="mood-label">{moment.mood}</span>
      </div>

      <div className="card-actions">
        {moment.isMine ? (
          <button className="own-reactions" disabled><Heart size={18} />收到共鸣 · {moment.reactions}</button>
        ) : (
          <button className={reacted ? 'reacted' : ''} onClick={() => onReact(moment.id)}>
            <Heart size={18} fill={reacted ? 'currentColor' : 'none'} />
            {reacted ? '我们一样' : '我也是'} · {moment.reactions}
          </button>
        )}
        <button onClick={() => onReply(moment)}><MessageCircle size={18} />{moment.isMine ? `查看回应${replyCount ? ` · ${replyCount}` : ''}` : responded ? '已回应' : '回应'}</button>
      </div>
    </article>
  );
}

function HomeView({ moments, topicMoments, reacted, replyThreads, onReact, onReply, onEdit, onArchive, onDelete, onFeedback, debugMode, onExplain, onStartTopic, toast }) {
  const [homeTab, setHomeTab] = useState('moments');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [topicQuery, setTopicQuery] = useState('');
  const [batchStart, setBatchStart] = useState(0);
  const visibleCount = Math.min(3, moments.length);
  const visibleMoments = Array.from(
    { length: visibleCount },
    (_, index) => moments[(batchStart + index) % moments.length],
  );
  useEffect(() => {
    if (batchStart >= moments.length) setBatchStart(0);
  }, [batchStart, moments.length]);
  const changeBatch = () => {
    if (moments.length <= visibleCount) {
      toast('暂时没有更多此刻');
      return;
    }
    setBatchStart((current) => (current + visibleCount) % moments.length);
  };
  const topicCounts = useMemo(() => {
    const counts = new Map();
    topicMoments.forEach((moment) => {
      (moment.tags || []).forEach((tag) => {
        const current = counts.get(tag) || { count: 0, latestAt: 0 };
        counts.set(tag, { count: current.count + 1, latestAt: Math.max(current.latestAt, moment.createdAt) });
      });
    });
    return [...counts.entries()].map(([topic, meta]) => ({ topic, ...meta }));
  }, [topicMoments]);
  const normalizedQuery = topicQuery.trim().replace(/^#/, '');
  const visibleTopics = topicCounts
    .filter(({ topic }) => !normalizedQuery || topic.includes(normalizedQuery))
    .sort((a, b) => {
      const exactDifference = Number(b.topic === normalizedQuery) - Number(a.topic === normalizedQuery);
      return exactDifference || b.count - a.count || b.latestAt - a.latestAt || a.topic.localeCompare(b.topic, 'zh-CN');
    });
  const selectedTopicMoments = selectedTopic
    ? topicMoments
        .filter((moment) => moment.tags?.includes(selectedTopic))
        .sort((a, b) => b.createdAt - a.createdAt)
    : [];
  const renderMoment = (moment) => {
    const momentThreads = replyThreads.filter((thread) => thread.momentId === moment.id);
    return <MomentCard key={moment.id} moment={moment} reacted={reacted.includes(moment.id)} responded={momentThreads.some((thread) => thread.messages.some((message) => message.sender === 'me'))} replyCount={momentThreads.length} onReact={onReact} onReply={onReply} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} onFeedback={onFeedback} debugMode={debugMode} onExplain={onExplain} />;
  };
  return (
    <div className="view home-view">
      <nav className="home-tabs" aria-label="首页内容">
        <button className={homeTab === 'moments' ? 'active' : ''} onClick={() => { setHomeTab('moments'); setSelectedTopic(''); }}>此刻</button>
        <button className={homeTab === 'topics' ? 'active' : ''} onClick={() => setHomeTab('topics')}>话题</button>
      </nav>

      {homeTab === 'moments' ? <>
        <div className="section-title">
          <div><span className="live-dot" />正在发生</div>
          <button className="change-batch-button" onClick={changeBatch}><RefreshCw size={13} />换一组</button>
        </div>
        <div className="feed">{visibleMoments.map(renderMoment)}</div>
      </> : selectedTopic ? <>
        <div className="topic-detail-head">
          <button onClick={() => setSelectedTopic('')} aria-label="返回话题列表"><ChevronLeft size={18} /></button>
          <div><strong>#{selectedTopic}</strong><span>{selectedTopicMoments.length} 个此刻</span></div>
        </div>
        <div className="feed">{selectedTopicMoments.map(renderMoment)}</div>
      </> : <section className="topic-list" aria-label="24小时内的话题">
        <label className="topic-search">
          <Search size={17} />
          <input value={topicQuery} onChange={(event) => setTopicQuery(event.target.value)} placeholder="搜索24小时内的话题" aria-label="搜索话题" />
          {topicQuery && <button onClick={() => setTopicQuery('')} aria-label="清空搜索"><X size={16} /></button>}
        </label>
        <div className="topic-list-caption"><strong>正在聊</strong><span>最近24小时</span></div>
        {visibleTopics.map(({ topic, count }) => (
          <button key={topic} onClick={() => setSelectedTopic(topic)}>
            <span className="topic-hash"><Hash size={16} /></span>
            <span><strong>{topic}</strong><small>{count} 个此刻</small></span>
            <ChevronRight size={17} />
          </button>
        ))}
        {!visibleTopics.length && <div className="topic-empty">
          <strong>{normalizedQuery ? `暂时没有与“${normalizedQuery}”相关的话题` : '暂时还没有话题'}</strong>
          {normalizedQuery && <button onClick={() => onStartTopic(normalizedQuery)}><Plus size={15} />发布这个话题</button>}
        </div>}
      </section>}
    </div>
  );
}

function MessagesView({ toast, replyThreads, resonanceMessages, onSendReply, onReadThread, onReadResonance, onReadAll, ownProfile }) {
  const [messageTab, setMessageTab] = useState('回应');
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [selectedResonance, setSelectedResonance] = useState(null);
  const [replyText, setReplyText] = useState('');
  const unreadReplyCount = replyThreads.filter((thread) => thread.unread).length;
  const unreadResonanceCount = resonanceMessages.filter((message) => message.unread).length;
  const unreadTotal = unreadReplyCount + unreadResonanceCount;
  const formattedResonanceMessages = resonanceMessages.map((message) => ({ ...message, time: relativeTime(message.createdAt) }));
  const selectedThread = replyThreads.find((thread) => thread.id === selectedMessageId) || null;
  const selectedThreadLastMessage = selectedThread?.messages.at(-1);
  const ownPerson = { user: ownProfile.name, avatar: ownProfile.name.slice(0, 1), avatarUrl: ownProfile.avatar || '', color: '#d95f45' };
  const selectedMessage = selectedThread ? {
    ...selectedThread,
    type: '回应',
    time: selectedThreadLastMessage ? relativeTime(selectedThreadLastMessage.createdAt) : '',
  } : selectedResonance;
  const responseGroups = [...replyThreads.reduce((groups, thread) => {
    const personKey = thread.persisted ? thread.otherId : `mock:${thread.user}`;
    const current = groups.get(personKey) || { id: `person-${personKey}`, personKey, type: '回应', user: thread.user, avatar: thread.avatar, avatarUrl: thread.avatarUrl, color: thread.color, threads: [], unread: false };
    current.threads.push(thread);
    current.unread = current.unread || thread.unread;
    groups.set(personKey, current);
    return groups;
  }, new Map()).values()].map((group) => {
    const threads = [...group.threads].sort((a, b) => (b.messages.at(-1)?.createdAt || 0) - (a.messages.at(-1)?.createdAt || 0));
    const latestMessage = threads[0]?.messages.at(-1);
    return {
      ...group,
      threads,
      preview: `${latestMessage?.sender === 'me' ? '你：' : ''}${latestMessage?.body || ''}`,
      time: latestMessage ? relativeTime(latestMessage.createdAt) : '',
      source: `涉及 ${threads.length} 条此刻`,
    };
  }).sort((a, b) => (b.threads[0]?.messages.at(-1)?.createdAt || 0) - (a.threads[0]?.messages.at(-1)?.createdAt || 0));
  const selectedPerson = responseGroups.find((group) => group.personKey === selectedPersonId) || null;
  const visibleMessages = messageTab === '回应' ? responseGroups : formattedResonanceMessages;
  const openMessage = (message) => {
    setReplyText('');
    if (message.type === '回应') {
      setSelectedPersonId(message.personKey);
      setSelectedMessageId(null);
      setSelectedResonance(null);
    }
  };
  const sendMessageReply = async () => {
    const nextReply = replyText.trim();
    if (!nextReply || !selectedThread) return;
    const sent = await onSendReply(selectedThread, nextReply);
    if (sent) setReplyText('');
  };
  return (
    <div className="view messages-view">
      <div className="simple-header">
        <h1>消息</h1>
        <button className="message-read-all" disabled={!unreadTotal} onClick={onReadAll} aria-label={unreadTotal ? `将 ${unreadTotal} 条消息标为已读` : '没有未读消息'}><CheckCheck size={16} /><span>全部已读</span>{Boolean(unreadTotal) && <small>{unreadTotal}</small>}</button>
      </div>
      <div className="message-tabs">
        {['回应', '共鸣'].map((item) => {
          const unreadCount = item === '回应' ? unreadReplyCount : unreadResonanceCount;
          const totalCount = item === '回应' ? responseGroups.length : formattedResonanceMessages.length;
          return <button className={messageTab === item ? 'active' : ''} onClick={() => setMessageTab(item)} key={item}>{item}<span className={unreadCount ? 'has-unread' : ''}>{unreadCount || totalCount}</span></button>;
        })}
      </div>
      <div className="message-list">
        {visibleMessages.map((message) => message.type === '共鸣' ? (
          <button className="message-row resonance-row" key={message.id} onClick={() => message.unread && onReadResonance(message.id)}>
            <MessageAvatar person={message} unread={message.unread} />
            <div className="message-body">
              <div><strong>{message.user}</strong><time>{message.time}</time></div>
              <p>{message.preview}</p>
              <small>{message.source}</small>
            </div>
            <Heart size={17} fill="currentColor" />
          </button>
        ) : (
          <button className="message-row" key={message.id} onClick={() => openMessage(message)}>
            <MessageAvatar person={message} unread={message.unread} />
            <div className="message-body">
              <div><strong>{message.user}</strong><time>{message.time}</time></div>
              <p>{message.preview}</p>
              <small>{message.source}</small>
            </div>
            <ChevronRight size={17} />
          </button>
        ))}
        {!visibleMessages.length && <div className="message-empty">暂无{messageTab}</div>}
      </div>
      {selectedPerson && !selectedThread && (
        <section className="message-detail-view person-thread-view">
          <header className="message-detail-header">
            <button className="icon-button" onClick={() => setSelectedPersonId(null)} aria-label="返回消息列表"><ChevronLeft size={21} /></button>
            <div className="message-detail-person">
              <MessageAvatar person={selectedPerson} />
              <div><strong>{selectedPerson.user}</strong><span>有 {selectedPerson.threads.length} 条回应记录</span></div>
            </div>
            <span />
          </header>
          <div className="person-thread-list">
            {selectedPerson.threads.map((thread) => {
              const lastMessage = thread.messages.at(-1);
              const ended = Date.now() >= thread.expiresAt;
              return (
                <button className="person-thread-card" key={thread.id} onClick={() => { setSelectedMessageId(thread.id); onReadThread(thread); }}>
                  <div className="person-thread-source"><span>{thread.sourceOwner === 'me' ? '你的此刻' : `来自${thread.user}的此刻`}</span>{thread.unread && <i />}</div>
                  <strong>{thread.source}</strong>
                  <p>{lastMessage?.sender === 'me' ? '你：' : `${thread.user}：`}{lastMessage?.body}</p>
                  <div><small>{ended ? '已结束' : `${remainingTime(thread.expiresAt)} 后结束`}</small><ChevronRight size={16} /></div>
                </button>
              );
            })}
          </div>
        </section>
      )}
      {selectedMessage && (
        <section className="message-detail-view">
          <header className="message-detail-header">
            <button className="icon-button" onClick={() => { setSelectedMessageId(null); setSelectedResonance(null); }} aria-label="返回上一页"><ChevronLeft size={21} /></button>
            <div className="message-detail-person">
              <MessageAvatar person={selectedMessage} />
              <div><strong>{selectedMessage.user}</strong><span>{selectedMessage.type === '回应' ? '与你的私密回应' : '与你产生了共鸣'}</span></div>
            </div>
            <time>{selectedMessage.time}</time>
          </header>

          <div className="message-detail-scroll">
            <section className="message-source-card">
              <span>{selectedThread ? (selectedThread.sourceOwner === 'me' ? `${selectedMessage.user}回应了你的此刻` : `来自${selectedMessage.user}的此刻`) : `${selectedMessage.user}共鸣了你的此刻`}</span>
              <p>{selectedMessage.source}</p>
            </section>
            <div className="conversation">
              <div className="conversation-time">{selectedMessage.time}</div>
              {(selectedThread?.messages || [{ id: selectedMessage.id, body: selectedMessage.preview, sender: 'them', createdAt: Date.now() }]).map((message, index, messages) => {
                const showAvatar = index === 0 || messages[index - 1]?.sender !== message.sender;
                return <div className={`bubble-row ${message.sender === 'me' ? 'outgoing' : 'incoming'}`} key={message.id}>
                  {message.sender !== 'me' && (showAvatar ? <MessageAvatar person={selectedMessage} /> : <span className="message-avatar-spacer" />)}
                  <p>{message.body}</p>
                  {message.sender === 'me' && (showAvatar ? <MessageAvatar person={ownPerson} /> : <span className="message-avatar-spacer" />)}
                </div>;
              })}
            </div>
          </div>

          {selectedThread && Date.now() < selectedThread.expiresAt && (
            <div className="message-detail-input">
              <input value={replyText} maxLength={120} onChange={(event) => setReplyText(event.target.value)} placeholder="回复一句" />
              <button disabled={!replyText.trim()} onClick={sendMessageReply} aria-label="发送回复"><Send size={18} /></button>
            </div>
          )}
          {selectedThread && Date.now() >= selectedThread.expiresAt && <div className="thread-ended">这条此刻已结束，回应仅供查看</div>}
        </section>
      )}
    </div>
  );
}

function MemoryView({ archivedMoments, hiddenMemoryIds, onDelete }) {
  const [selectedMonth, setSelectedMonth] = useState('全部');
  const [filterOpen, setFilterOpen] = useState(false);
  const [openMemoryMenu, setOpenMemoryMenu] = useState(null);
  useEffect(() => {
    if (!openMemoryMenu) return undefined;
    const closeMenu = () => setOpenMemoryMenu(null);
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') closeMenu();
    };
    window.addEventListener('click', closeMenu);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('click', closeMenu);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [openMemoryMenu]);
  const memories = archivedMoments.map((moment) => {
    const recordDate = new Date(moment.createdAt || moment.archivedAt || Date.now());
    return {
      ...moment,
      day: recordDate.getDate().toString().padStart(2, '0'),
      month: `${recordDate.getFullYear()}年${recordDate.getMonth() + 1}月`,
      displayMonth: `${recordDate.getFullYear()}.${(recordDate.getMonth() + 1).toString().padStart(2, '0')}`,
      tags: moment.tags || [],
      color: moment.color || '#d95f45',
    };
  }).filter((memory) => !hiddenMemoryIds.includes(memory.id));
  const monthOptions = ['全部', ...new Set(memories.map((memory) => memory.month))];
  const filteredMemories = selectedMonth === '全部' ? memories : memories.filter((memory) => memory.month === selectedMonth);
  return (
    <div className="view memory-view">
      <div className="simple-header">
        <h1>回声</h1>
        <button className="memory-filter-button" onClick={() => setFilterOpen((value) => !value)} aria-expanded={filterOpen}><CalendarDays size={18} /><span>{selectedMonth}</span></button>
      </div>
      {filterOpen && (
        <div className="month-filter-popover">
          <strong>按月份查看</strong>
          {monthOptions.map((month) => <button className={selectedMonth === month ? 'active' : ''} onClick={() => { setSelectedMonth(month); setFilterOpen(false); }} key={month}>{month}{selectedMonth === month && <Check size={14} />}</button>)}
        </div>
      )}
      <div className="memory-count">{filteredMemories.length} 条记录</div>
      <div className="timeline">
        {filteredMemories.map((memory, index) => {
          const preview = memoryPreview(memory.text, memory.tags);
          return (
            <article key={`${memory.month}-${memory.day}-${index}`} className="memory-item">
              <div className="date-block"><strong>{memory.day}</strong><span>{memory.displayMonth}</span></div>
              <div className="timeline-line"><span /></div>
              <div className="memory-content">
                <div className="memory-copy-row">
                  <p>{preview.text}</p>
                  <button className="memory-menu-button" onClick={(event) => { event.stopPropagation(); setOpenMemoryMenu((current) => current === memory.id ? null : memory.id); }} aria-label="管理这条回声"><MoreHorizontal size={18} /></button>
                </div>
                {openMemoryMenu === memory.id && (
                  <div className="memory-menu" onClick={(event) => event.stopPropagation()}>
                    <button onClick={() => { setOpenMemoryMenu(null); onDelete({ ...memory, isMemory: true }); }}><Trash2 size={15} />删除记录</button>
                  </div>
                )}
                <MomentImages moment={memory} className="memory-gallery" />
                {preview.topics.length > 0 && <div className="memory-topics">{preview.topics.map((topic) => <span key={topic}>#{topic}</span>)}</div>}
                <div className="memory-meta"><span className="memory-mood">{memory.mood}</span><small><Heart size={12} /> {memory.reactions ?? Number(memory.day) + 3} 次“我也是”</small></div>
              </div>
            </article>
          );
        })}
        {filteredMemories.length === 0 && <div className="memory-empty">这个月还没有留下回声</div>}
      </div>
    </div>
  );
}

function ProfileView({ onCompose, onEditDraft, toast, drafts, onDeleteDraft, stats, defaultVisibility, onDefaultVisibilityChange, currentUser, onSignOut, debugMode, onToggleDebugMode }) {
  const avatarInputRef = useRef(null);
  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`yitian-profile:${currentUser.id}`)) || { name: currentUser.user_metadata?.nickname || '林间', signature: '在广州生活的第 312 天', avatar: '', avatarPath: '' };
    } catch {
      return { name: '林间', signature: '在广州生活的第 312 天', avatar: '' };
    }
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [confirmDraftDelete, setConfirmDraftDelete] = useState(false);
  const [profileForm, setProfileForm] = useState(profile);
  const [savingProfile, setSavingProfile] = useState(false);
  const versionTapRef = useRef({ count: 0, lastTap: 0 });

  const tapVersion = () => {
    const currentTime = Date.now();
    const nextCount = currentTime - versionTapRef.current.lastTap > 1200 ? 1 : versionTapRef.current.count + 1;
    versionTapRef.current = { count: nextCount, lastTap: currentTime };
    if (nextCount === 3) {
      versionTapRef.current = { count: 0, lastTap: 0 };
      onToggleDebugMode();
      toast(debugMode ? '推荐演示模式已关闭' : '推荐演示模式已开启');
    }
  };

  const openProfileEditor = () => {
    setProfileForm({ ...profile, signature: profile.signature ?? profile.status ?? '' });
    setEditingProfile(true);
  };

  const saveProfile = async () => {
    const nextProfile = { name: profileForm.name.trim(), signature: profileForm.signature.trim(), avatar: profileForm.avatar || '', avatarPath: profileForm.avatarPath || '' };
    if (!nextProfile.name || savingProfile) return;
    setSavingProfile(true);
    try {
      const savedAvatar = await saveProfileToDatabase({ nickname: nextProfile.name, signature: nextProfile.signature, avatarSource: nextProfile.avatar, existingAvatarPath: nextProfile.avatarPath });
      const syncedProfile = { ...nextProfile, avatar: savedAvatar.avatarUrl, avatarPath: savedAvatar.avatarPath };
      setProfile(syncedProfile);
      localStorage.setItem(`yitian-profile:${currentUser.id}`, JSON.stringify(syncedProfile));
      window.dispatchEvent(new CustomEvent('yitian-profile-updated', { detail: syncedProfile }));
      setEditingProfile(false);
      toast('资料已同步');
    } catch (error) {
      console.error('保存资料失败', error);
      const errorText = `${error?.message || ''} ${error?.code || ''}`;
      if (/bucket.*not found/i.test(errorText)) toast('头像存储未创建，请先运行 005 迁移');
      else if (/avatar_url|column/i.test(errorText)) toast('资料表未升级，请先运行 005 迁移');
      else if (/row-level security|policy|403|42501/i.test(errorText)) toast('头像上传权限未生效，请重新运行 005 迁移');
      else if (/mime|media type|413|too large/i.test(errorText)) toast('图片格式或大小不符合要求');
      else toast(`保存失败：${error?.message || '请稍后重试'}`);
    } finally {
      setSavingProfile(false);
    }
  };

  const selectAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast('请选择图片文件');
    if (file.size > 10 * 1024 * 1024) return toast('原图不能超过 10MB');
    try {
      const compressedAvatar = await compressImage(file);
      setProfileForm((current) => ({ ...current, avatar: compressedAvatar }));
    } catch {
      toast('暂不支持这种图片格式，请换一张');
    }
  };
  const recordPrompt = stats.daysSinceLast === null
    ? { title: '从今天开始留下此刻', copy: '不需要完整，一句话也很好。', action: '去记录' }
    : stats.daysSinceLast === 0
      ? { title: '今天已经留下此刻', copy: '想起什么，还可以继续记录。', action: '再记录' }
      : stats.daysSinceLast === 1
        ? { title: '昨天之后，还没有新记录', copy: '不需要完整，一句话也很好。', action: '去记录' }
        : { title: `已经 ${stats.daysSinceLast} 天没有留下此刻`, copy: '不需要完整，一句话也很好。', action: '去记录' };

  return (
    <div className="view profile-view">
      <div className="profile-head"><div className="profile-avatar">{profile.avatar ? <img src={profile.avatar} alt="个人头像" /> : profile.name.slice(0, 1)}</div><div><h1>{profile.name}</h1><p>{profile.signature ?? profile.status ?? '记录今天，也收藏自己'}</p></div><button onClick={openProfileEditor}>编辑</button></div>
      <div className="profile-stats"><div><strong>{stats.moments}</strong><span>此刻</span></div><div><strong>{stats.reactions}</strong><span>共鸣</span></div><div><strong>{stats.days}</strong><span>天数</span></div></div>
      <section className="profile-prompt"><div><Sparkles size={20} /><strong>{recordPrompt.title}</strong><p>{recordPrompt.copy}</p></div><button onClick={onCompose}>{recordPrompt.action}</button></section>
      <div className="settings-list">
        {['我的草稿', '隐私与可见范围', '账号与安全', '通知设置', '数据与导出', '关于一天'].map((item) => (
          <button key={item} onClick={() => item === '我的草稿' ? setDraftsOpen(true) : item === '隐私与可见范围' ? setPrivacyOpen(true) : item === '账号与安全' ? setAccountOpen(true) : item === '关于一天' ? setAboutOpen(true) : toast(`${item}将在后续版本完善`)}>
            <span>{item}</span>
            {item === '我的草稿' && <small>{drafts.length ? `${drafts.length} 篇` : '暂无'}</small>}
            {item === '隐私与可见范围' && <small>{defaultVisibility}</small>}
            {item === '账号与安全' && <small>{currentUser.email}</small>}
            <ChevronRight size={18} />
          </button>
        ))}
      </div>
      {editingProfile && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setEditingProfile(false)}>
          <section className="profile-edit-sheet" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title">
            <div className="profile-edit-head">
              <button className="icon-button" onClick={() => setEditingProfile(false)} aria-label="关闭编辑资料"><X size={20} /></button>
              <strong id="profile-edit-title">编辑资料</strong>
              <button className="profile-save" disabled={!profileForm.name.trim() || savingProfile} onClick={saveProfile}>{savingProfile ? '保存中' : '保存'}</button>
            </div>
            <button className="profile-edit-avatar" onClick={() => avatarInputRef.current?.click()} aria-label="更换头像">
              {profileForm.avatar ? <img src={profileForm.avatar} alt="头像预览" /> : (profileForm.name.trim() || profile.name).slice(0, 1)}
              <span><Camera size={13} /></span>
            </button>
            <input ref={avatarInputRef} className="avatar-file-input" type="file" accept="image/*" onChange={selectAvatar} />
            <label className="profile-edit-field">
              <span>昵称</span>
              <div><input value={profileForm.name} maxLength={8} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} placeholder="输入昵称" /><small>{profileForm.name.length}/8</small></div>
            </label>
            <label className="profile-edit-field">
              <span>个人签名</span>
              <div><input value={profileForm.signature || ''} maxLength={30} onChange={(event) => setProfileForm((current) => ({ ...current, signature: event.target.value }))} placeholder="写一句现在的自己" /><small>{(profileForm.signature || '').length}/30</small></div>
            </label>
          </section>
        </div>
      )}
      {draftsOpen && (
        <div className="modal-backdrop">
          <section className="drafts-page" role="dialog" aria-modal="true" aria-labelledby="drafts-title">
            <header className="drafts-head">
              <button className="icon-button" onClick={() => setDraftsOpen(false)} aria-label="返回个人主页"><ChevronLeft size={21} /></button>
              <strong id="drafts-title">我的草稿</strong>
              <span>{drafts.length ? `${drafts.length} 篇` : ''}</span>
            </header>
            <div className="drafts-content">
              {drafts.length ? (
                <div className="draft-list">
                  {drafts.map((draft) => (
                    <article className="draft-card" key={draft.id}>
                      <div className="draft-card-head"><span>保存于 {draft.savedAtLabel || '刚刚'}</span><button onClick={() => setConfirmDraftDelete(draft.id)} aria-label="删除草稿"><Trash2 size={17} /></button></div>
                      <p>{draft.text?.trim() || '还没有写下正文'}</p>
                      <div className="draft-meta">
                        {draft.mood && <span>{draft.mood}</span>}
                        {draft.tags?.slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}
                        {draft.hasPhoto && <span><Images size={12} />{draft.images?.length || 1} 张图片</span>}
                      </div>
                      <button className="draft-continue" onClick={() => { setDraftsOpen(false); onEditDraft(draft.id); }}>继续编辑</button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="drafts-empty"><Pencil size={28} /><strong>还没有草稿</strong><p>退出发布页前保存的内容会出现在这里</p><button onClick={() => { setDraftsOpen(false); onCompose(); }}>去记录</button></div>
              )}
            </div>
          </section>
          {confirmDraftDelete && (
            <div className="draft-delete-layer" onClick={() => setConfirmDraftDelete(false)}>
              <section onClick={(event) => event.stopPropagation()}><strong>删除这篇草稿？</strong><p>删除后无法恢复。</p><div><button onClick={() => setConfirmDraftDelete(false)}>取消</button><button className="danger" onClick={() => { onDeleteDraft(confirmDraftDelete); setConfirmDraftDelete(false); }}>删除</button></div></section>
            </div>
          )}
        </div>
      )}
      {privacyOpen && (
        <div className="modal-backdrop">
          <section className="privacy-page" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
            <header className="privacy-head">
              <button className="icon-button" onClick={() => setPrivacyOpen(false)} aria-label="返回个人主页"><ChevronLeft size={21} /></button>
              <strong id="privacy-title">隐私与可见范围</strong>
              <span />
            </header>
            <div className="privacy-content">
              <div className="privacy-section-title"><strong>默认可见范围</strong><span>仅用于之后发布的内容</span></div>
              <div className="privacy-options">
                <button className={defaultVisibility === '同频的人' ? 'selected' : ''} onClick={() => onDefaultVisibilityChange('同频的人')}>
                  <span className="privacy-option-icon"><Users size={19} /></span>
                  <span><strong>同频的人</strong><small>参与推荐，处于相似状态的人可见</small></span>
                  <span className="privacy-check">{defaultVisibility === '同频的人' && <Check size={14} />}</span>
                </button>
                <button className={defaultVisibility === '仅自己' ? 'selected' : ''} onClick={() => onDefaultVisibilityChange('仅自己')}>
                  <span className="privacy-option-icon"><Lock size={19} /></span>
                  <span><strong>仅自己</strong><small>不参与推荐，直接保存在回声</small></span>
                  <span className="privacy-check">{defaultVisibility === '仅自己' && <Check size={14} />}</span>
                </button>
              </div>
              <div className="privacy-section-title privacy-rules-title"><strong>可见规则</strong></div>
              <div className="privacy-rules">
                <div><Clock3 size={18} /><span><strong>公开 24 小时</strong><small>到期后退出推荐，只有你能在回声中查看</small></span></div>
                <div><MapPin size={18} /><span><strong>位置由你决定</strong><small>默认不展示位置，也不会公开实时坐标和距离</small></span></div>
              </div>
              <p className="privacy-note">修改默认设置不会影响已经发布的内容。</p>
            </div>
          </section>
        </div>
      )}
      {accountOpen && (
        <div className="modal-backdrop">
          <section className="account-page" role="dialog" aria-modal="true" aria-labelledby="account-title">
            <header className="privacy-head">
              <button className="icon-button" onClick={() => setAccountOpen(false)} aria-label="返回个人主页"><ChevronLeft size={21} /></button>
              <strong id="account-title">账号与安全</strong>
              <span />
            </header>
            <div className="account-content">
              <div className="account-profile"><div className="profile-avatar">{profile.avatar ? <img src={profile.avatar} alt="个人头像" /> : profile.name.slice(0, 1)}</div><div><strong>{profile.name}</strong><span>{currentUser.email}</span></div></div>
              <div className="account-info"><div><span>登录方式</span><strong>邮箱密码</strong></div><div><span>用户 ID</span><strong>{currentUser.id.slice(0, 8)}...</strong></div></div>
              <button className="switch-account-button" onClick={onSignOut}>退出并切换账号</button>
              <p>退出后可注册或登录其他账号，当前账号的数据仍保存在 Supabase。</p>
            </div>
          </section>
        </div>
      )}
      {aboutOpen && (
        <div className="modal-backdrop">
          <section className="about-page" role="dialog" aria-modal="true" aria-labelledby="about-title">
            <header className="privacy-head">
              <button className="icon-button" onClick={() => setAboutOpen(false)} aria-label="返回个人主页"><ChevronLeft size={21} /></button>
              <strong id="about-title">关于一天</strong>
              <span />
            </header>
            <div className="about-content">
              <div className="about-brand"><strong>一天</strong><span>记录今天，也收藏自己</span></div>
              <button className="about-version" onClick={tapVersion}><span>版本</span><strong>1.0.0</strong></button>
              {debugMode && <div className="debug-mode-status"><Sparkles size={16} /><span><strong>推荐演示模式</strong><small>点击首页同频标签可查看推荐机制</small></span><b>已开启</b></div>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Composer({ onClose, onPublish, onUpdate, onDraft, draft, editingMoment, onClearDraft, defaultVisibility }) {
  const source = editingMoment || draft;
  const imageInputRef = useRef(null);
  const [text, setText] = useState(source?.text || '');
  const [mood, setMood] = useState(source?.mood || '');
  const [moodMode, setMoodMode] = useState(false);
  const [customMood, setCustomMood] = useState('');
  const [tags, setTags] = useState(source?.tags || []);
  const [topicMode, setTopicMode] = useState(false);
  const [topicQuery, setTopicQuery] = useState('');
  const [images, setImages] = useState(() => source?.images?.length ? source.images : (source?.image ? [source.image] : []));
  const [visibility, setVisibility] = useState(source?.visibility || defaultVisibility);
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [location, setLocation] = useState(source?.location || '不展示位置');
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [keyboardActive, setKeyboardActive] = useState(false);
  const textAreaRef = useRef(null);
  const highlightRef = useRef(null);
  const activePanelRef = useRef(null);

  useEffect(() => {
    if (!keyboardActive || (!topicMode && !moodMode)) return;
    requestAnimationFrame(() => activePanelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }, [keyboardActive, topicMode, moodMode, topicQuery]);

  const syncTopics = (value, cursorPosition) => {
    const extracted = extractTopics(value);
    setTags([...new Set(extracted)].slice(0, 3));
    const beforeCursor = value.slice(0, cursorPosition);
    const activeTopic = beforeCursor.match(/#([^#\s]*)$/);
    setTopicMode(Boolean(activeTopic));
    setTopicQuery(activeTopic?.[1] || '');
    if (activeTopic) setMoodMode(false);
  };

  const handleTextChange = (event) => {
    const value = event.target.value;
    setText(value);
    syncTopics(value, event.target.selectionStart);
  };

  const insertTopic = (name = '') => {
    setMoodMode(false);
    const input = textAreaRef.current;
    const cursor = input?.selectionStart ?? text.length;
    const beforeCursor = text.slice(0, cursor);
    const activeTopic = beforeCursor.match(/#([^#\s]*)$/);
    const start = activeTopic ? cursor - activeTopic[0].length : cursor;
    const prefix = activeTopic || cursor === 0 || /\s$/.test(beforeCursor) ? '' : ' ';
    const insertion = name ? `${prefix}#${name} ` : `${prefix}#`;
    const nextText = `${text.slice(0, start)}${insertion}${text.slice(cursor)}`.slice(0, 120);
    const nextCursor = Math.min(start + insertion.length, 120);
    setText(nextText);
    syncTopics(nextText, name ? nextCursor : nextCursor);
    if (name) setTopicMode(false);
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const filteredTopics = topicSuggestions.filter((topic) => !topicQuery || topic.name.includes(topicQuery));
  const filteredLocations = locationOptions.filter((item) => !locationQuery || `${item.name}${item.type}${item.detail}`.includes(locationQuery));
  const addCustomMood = () => {
    const normalized = customMood.trim().replace(/[#@，。！？!?]/g, '').slice(0, 4);
    if (!normalized) return;
    setMood(normalized);
    setCustomMood('');
    setMoodMode(false);
  };
  const selectImages = async (event) => {
    const files = [...(event.target.files || [])];
    event.target.value = '';
    const available = 4 - images.length;
    if (!available) return;
    const selected = files.filter((file) => file.type.startsWith('image/')).slice(0, available);
    if (!selected.length) return;
    try {
      const nextImages = await Promise.all(selected.map(compressImage));
      setImages((current) => [...current, ...nextImages].slice(0, 4));
    } catch {
      window.alert('图片读取失败，请重新选择');
    }
  };
  const hasPhoto = images.length > 0;
  const hasDraftContent = Boolean(text.trim() || mood || tags.length || hasPhoto || location !== '不展示位置');
  const clearCurrentDraft = () => {
    setText('');
    setMood('');
    setTags([]);
    setImages([]);
    setVisibility(defaultVisibility);
    setLocation('不展示位置');
    onClearDraft();
  };
  return (
    <div className="modal-backdrop">
      <div className="composer">
        <div className={`composer-head ${keyboardActive ? 'keyboard-active' : ''}`}>
          <button className="icon-button" onClick={onClose} aria-label="关闭发布页"><X size={20} /></button>
          <strong>{editingMoment ? '编辑此刻' : '发布此刻'}</strong>
          {keyboardActive ? <div className="composer-head-actions">
            {!editingMoment && <button disabled={!hasDraftContent} onMouseDown={(event) => event.preventDefault()} onClick={() => onDraft({ text, mood, tags, images, image: images[0] || null, hasPhoto, visibility, location })}>存草稿</button>}
            <button className="publish" disabled={!text.trim()} onMouseDown={(event) => event.preventDefault()} onClick={() => (editingMoment ? onUpdate : onPublish)({ text, mood: mood || '未标记', tags, images, image: images[0] || null, hasPhoto, visibility, location })}>{editingMoment ? '保存' : '发布'}</button>
          </div> : <span />}
        </div>

        <div className="composer-scroll">
          {draft && !draft.isTopicSeed && !editingMoment && (
            <div className="draft-restored">
              <Clock3 size={15} />
              <span><strong>已恢复上次草稿</strong><small>{draft.savedAtLabel}</small></span>
              <button onClick={clearCurrentDraft}>清空</button>
            </div>
          )}
          <div className="writing-area">
            <div className="text-editor-stack">
              <div ref={highlightRef} className="textarea-highlight" aria-hidden="true"><HighlightedText text={text} /></div>
              <textarea ref={textAreaRef} autoFocus maxLength={120} value={text} onFocus={() => setKeyboardActive(true)} onBlur={() => window.setTimeout(() => setKeyboardActive(document.activeElement === textAreaRef.current), 120)} onChange={handleTextChange} onScroll={(event) => { if (highlightRef.current) highlightRef.current.scrollTop = event.currentTarget.scrollTop; }} onClick={(event) => syncTopics(text, event.currentTarget.selectionStart)} placeholder="这一刻，你正在想什么？" />
            </div>
            <div className="char-count">{text.length}/120</div>
          </div>

          <div className="media-row">
            {images.map((image, index) => (
              <div className="media-preview" key={`${image.slice(0, 32)}-${index}`}>
                <img src={image} alt={`待发布图片 ${index + 1}`} />
                <button onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`删除第 ${index + 1} 张照片`}><X size={14} /></button>
                {index === 0 && <span className="cover-label">封面</span>}
              </div>
            ))}
            {images.length < 4 && <button className="media-add" onClick={() => imageInputRef.current?.click()} aria-label="添加照片">
              <Plus size={24} />
              <span>{images.length ? `${images.length}/4` : '添加照片'}</span>
            </button>}
            <input ref={imageInputRef} className="media-file-input" type="file" accept="image/*" multiple onChange={selectImages} />
          </div>

          <div className="composer-tools">
            <button onClick={() => imageInputRef.current?.click()}><Images size={18} /><span>图片</span></button>
            <button
              className={topicMode ? 'active' : ''}
              aria-expanded={topicMode}
              onClick={() => topicMode ? setTopicMode(false) : insertTopic()}
            ><Hash size={18} /><span>话题</span></button>
            <button
              className={moodMode || mood ? 'active' : ''}
              aria-expanded={moodMode}
              onClick={() => { setMoodMode((value) => !value); setTopicMode(false); }}
            ><Smile size={18} /><span>{mood || '心情'}</span></button>
          </div>

          {topicMode ? (
            <div ref={activePanelRef} className={`topic-results ${keyboardActive ? 'keyboard-panel' : ''}`}>
              <div className="topic-results-head"><strong>{topicQuery ? `与“${topicQuery}”相关` : '推荐话题'}</strong></div>
              {(filteredTopics.length ? filteredTopics : [{ name: topicQuery, count: '创建新话题' }]).slice(0, 5).map((topic) => (
                <button key={topic.name} onClick={() => insertTopic(topic.name)}>
                  <Hash size={17} />
                  <span>{topic.name}</span>
                  <small>{topic.count}</small>
                </button>
              ))}
            </div>
          ) : moodMode ? (
            <div ref={activePanelRef} className={`mood-panel ${keyboardActive ? 'keyboard-panel' : ''}`}>
              <div className="mood-panel-head"><strong>这一刻感觉如何？</strong></div>
              <div className="mood-options">
                {moods.map((item, index) => (
                  <button
                    className={mood === item ? 'active' : ''}
                    style={{ '--mood-color': ['#6f9b88', '#e3a14f', '#8290a5', '#d97858', '#8a7d99'][index] }}
                    onClick={() => { setMood(item); setMoodMode(false); }}
                    key={item}
                  ><span />{item}</button>
                ))}
                <button className="clear-mood" onClick={() => { setMood(''); setMoodMode(false); }}>不标记</button>
              </div>
              <div className="custom-mood-input">
                <input
                  value={customMood}
                  maxLength={4}
                  onChange={(event) => setCustomMood(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCustomMood(); } }}
                  placeholder="自定义感受，最多 4 个字"
                />
                <span>{customMood.length}/4</span>
                <button onClick={addCustomMood} disabled={!customMood.trim()} aria-label="添加自定义心情"><Plus size={16} /></button>
              </div>
            </div>
          ) : (
            <div className="topic-recommendations">
              <span>此刻相关</span>
              <div>{quickTags.slice(0, 5).map((tag) => <button key={tag} onClick={() => insertTopic(tag)}>#{tag}</button>)}</div>
            </div>
          )}

          <div className="publish-settings">
            <button onClick={() => setVisibilityOpen(true)}>
              <Users size={19} />
              <span><strong>可见范围</strong><small>{visibility}</small></span>
              <ChevronRight size={17} />
            </button>
            {visibility === '同频的人' && (
              <div className="setting-row static-setting">
                <Clock3 size={19} />
                <span><strong>自动归档</strong><small>24 小时后</small></span>
              </div>
            )}
            <button onClick={() => setLocationOpen(true)}>
              <MapPin size={19} />
              <span><strong>位置</strong><small>{location === '不展示位置' ? '不展示' : location}</small></span>
              <ChevronRight size={17} />
            </button>
          </div>

        </div>

        <div className={`composer-footer ${editingMoment ? 'editing-footer' : ''} ${keyboardActive ? 'keyboard-active' : ''}`}>
          {!editingMoment && <button
            className="draft-button"
            disabled={!hasDraftContent}
            onClick={() => onDraft({ text, mood, tags, images, image: images[0] || null, hasPhoto, visibility, location })}
          >存草稿</button>}
          <button className="composer-publish" disabled={!text.trim()} onClick={() => (editingMoment ? onUpdate : onPublish)({ text, mood: mood || '未标记', tags, images, image: images[0] || null, hasPhoto, visibility, location })}>
            {editingMoment ? '保存修改' : '发布此刻'}
          </button>
        </div>

        {visibilityOpen && (
          <div className="visibility-backdrop" onClick={() => setVisibilityOpen(false)}>
            <section className="visibility-sheet" onClick={(event) => event.stopPropagation()}>
              <div className="visibility-sheet-head">
                <div><strong>谁可以看到</strong><span>发布前可以随时修改</span></div>
                <button className="icon-button" onClick={() => setVisibilityOpen(false)} aria-label="关闭可见范围选择"><X size={20} /></button>
              </div>
              <div className="visibility-options">
                <button className={visibility === '同频的人' ? 'selected' : ''} onClick={() => { setVisibility('同频的人'); setVisibilityOpen(false); }}>
                  <span className="visibility-icon"><Users size={19} /></span>
                  <span className="visibility-copy"><strong>同频的人</strong><small>相似状态的人可见</small></span>
                  <span className="visibility-radio">{visibility === '同频的人' && <Check size={14} />}</span>
                </button>
                <button className={visibility === '仅自己' ? 'selected' : ''} onClick={() => { setVisibility('仅自己'); setVisibilityOpen(false); }}>
                  <span className="visibility-icon"><Lock size={19} /></span>
                  <span className="visibility-copy"><strong>仅自己</strong><small>只保存在回声</small></span>
                  <span className="visibility-radio">{visibility === '仅自己' && <Check size={14} />}</span>
                </button>
              </div>
            </section>
          </div>
        )}

        {locationOpen && (
          <div className="location-backdrop" onClick={() => setLocationOpen(false)}>
            <section className="location-sheet" onClick={(event) => event.stopPropagation()}>
              <div className="location-sheet-head">
                <div><strong>选择地点</strong><span>只展示你主动选择的名称</span></div>
                <button className="icon-button" onClick={() => setLocationOpen(false)} aria-label="关闭地点选择"><X size={20} /></button>
              </div>
              <div className="location-search">
                <Search size={18} />
                <input value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} placeholder="搜索城市或附近地点" />
                {locationQuery && <button onClick={() => setLocationQuery('')} aria-label="清除搜索"><X size={15} /></button>}
              </div>
              <div className="location-privacy"><MapPin size={14} />不会公开实时坐标、距离或行动轨迹</div>
              <div className="location-list">
                {filteredLocations.map((item) => (
                  <button className={location === item.name ? 'selected' : ''} onClick={() => setLocation(item.name)} key={item.name}>
                    <span className="location-radio">{location === item.name && <Check size={14} />}</span>
                    <span className="location-copy"><strong>{item.name}</strong><small>{item.type} · {item.detail}</small></span>
                    {item.distance && <span className="location-distance">{item.distance}</span>}
                  </button>
                ))}
                {filteredLocations.length === 0 && <div className="location-empty">没有找到相关地点</div>}
              </div>
              <button className="location-done" onClick={() => setLocationOpen(false)}>完成</button>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function ReplySheet({ moment, onClose, onSend }) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const submitReply = async () => {
    const body = reply.trim();
    if (!body || sending) return;
    setSending(true);
    const sent = await onSend(moment, body);
    setSending(false);
    if (sent) onClose();
  };
  return (
    <div className="modal-backdrop sheet-backdrop" onClick={onClose}>
      <div className="reply-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="reply-sheet-head">
          <div className="reply-person"><Avatar moment={moment} /><div><strong>回应 {moment.user}</strong><p>回应仅对你们两个人可见</p></div></div>
          <button className="icon-button" onClick={onClose} aria-label="关闭回应面板"><X size={20} /></button>
        </div>
        <div className="quick-replies">{['辛苦啦', '我也在路上', '明天会好一点'].map((text) => <button key={text} onClick={() => setReply(text)}>{text}</button>)}</div>
        <div className="reply-input"><input value={reply} maxLength={120} onChange={(event) => setReply(event.target.value)} placeholder="写一句真诚的回应" /><button disabled={!reply.trim() || sending} onClick={submitReply}><Send size={18} /></button></div>
      </div>
    </div>
  );
}

function BottomNav({ tab, onChange, onCompose, unreadCount }) {
  const items = [
    { id: 'home', label: '此刻', icon: Home },
    { id: 'messages', label: '消息', icon: MessageCircle, badge: unreadCount },
    { id: 'compose', label: '发布', icon: Plus, action: onCompose },
    { id: 'memory', label: '回声', icon: Clock3 },
    { id: 'profile', label: '我的', icon: UserRound },
  ];
  return (
    <nav className="bottom-nav">
      {items.map(({ id, label, icon: Icon, action, badge }) => id === 'compose' ? (
        <button className="nav-compose" onClick={action} key={id} aria-label="发布此刻">
          <span className="compose-circle"><Icon size={25} /></span>
          <span>{label}</span>
        </button>
      ) : (
        <button className={tab === id ? 'active' : ''} onClick={() => onChange(id)} key={id}>
          <span className="nav-icon-wrap">
            <Icon size={21} strokeWidth={tab === id ? 2.5 : 2} />
            {badge > 0 && <sup className="nav-badge" aria-label={`${badge} 条未读消息`}>{badge > 99 ? '99+' : badge}</sup>}
          </span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function ColdStartSheet({ onSave }) {
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState([]);
  const coldStartTags = ['治愈', '独处', '刚下班', '在路上', '校招', '雨天', '完成一件事', '第一次'];
  const toggleTag = (tag) => {
    setTags((current) => current.includes(tag)
      ? current.filter((item) => item !== tag)
      : current.length < 3 ? [...current, tag] : current);
  };
  return (
    <div className="modal-backdrop cold-start-backdrop">
      <section className="cold-start-sheet" role="dialog" aria-modal="true" aria-labelledby="cold-start-title">
        <div className="cold-start-heading">
          <Sparkles size={20} />
          <h2 id="cold-start-title">此刻，你想遇见什么？</h2>
          <p>选择会影响第一批同频内容，发布后将自动根据你的此刻推荐。</p>
        </div>
        <div className="cold-start-section">
          <strong>现在的心情</strong>
          <div className="cold-start-options mood-choices">
            {moods.map((item) => <button key={item} className={mood === item ? 'selected' : ''} onClick={() => setMood(item)}>{item}</button>)}
          </div>
        </div>
        <div className="cold-start-section">
          <div className="cold-start-label"><strong>想看的话题</strong><span>{tags.length}/3</span></div>
          <div className="cold-start-options topic-choices">
            {coldStartTags.map((tag) => <button key={tag} className={tags.includes(tag) ? 'selected' : ''} onClick={() => toggleTag(tag)}>#{tag}</button>)}
          </div>
        </div>
        <button className="cold-start-save" disabled={!mood || !tags.length} onClick={() => onSave({ mood, tags, matchCity: '' })}>看看同频的此刻</button>
      </section>
    </div>
  );
}

function RecommendationExplainSheet({ moment, onClose }) {
  const [expandedItem, setExpandedItem] = useState(null);
  const viewer = moment.matchedViewer || {};
  const viewerTags = viewer.tags || [];
  const candidateTags = moment.tags || [];
  const exactTopics = candidateTags.filter((tag) => viewerTags.includes(tag));
  const relatedPair = viewerTags.flatMap((viewerTag) => candidateTags.map((candidateTag) => [viewerTag, candidateTag]))
    .find(([viewerTag, candidateTag]) => topicsAreRelated(viewerTag, candidateTag));
  const ageHours = Math.floor(Math.max(0, Date.now() - moment.createdAt) / HOUR_MS);
  const viewerCity = canonicalCity(Object.prototype.hasOwnProperty.call(viewer, 'matchCity') ? viewer.matchCity : viewer.city);
  const candidateCity = canonicalCity(Object.prototype.hasOwnProperty.call(moment, 'matchCity') ? moment.matchCity : moment.city);
  const details = {
    mood: <p>你的心情“{viewer.mood || '未标记'}”，对方是“{moment.mood || '未标记'}”。{moment.scoreBreakdown?.mood === 3 ? '心情完全相同。' : moment.scoreBreakdown?.mood === 2 ? '属于相近心情。' : '未形成心情匹配。'}</p>,
    topic: <p>{exactTopics.length ? `共同话题：${exactTopics.map((tag) => `#${tag}`).join('、')}。` : relatedPair ? `你的 #${relatedPair[0]} 与对方的 #${relatedPair[1]} 属于相关话题。` : '双方暂时没有相同或相关话题。'}</p>,
    time: <p>这条内容发布于约{ageHours || 1}小时内，按照当前时间区间获得 {moment.scoreBreakdown?.time || 0} 分。</p>,
    location: <p>{moment.scoreBreakdown?.location ? `你们都在${viewerCity || candidateCity}，位置提供轻微辅助。` : `双方城市不同或未授权位置，因此不加分。`}</p>,
    feedback: <>
      {moment.feedbackDetails?.positiveWeight > 0 && <div className="feedback-source-detail">
        <strong>正反馈来源</strong>
        <p>来自你对 {moment.feedbackDetails.positiveTopics.slice(0, 2).map((topic) => `#${topic}`).join('、')} 内容的互动</p>
        <div>{moment.feedbackDetails.resonanceWeight > 0 && <span>共鸣 +{moment.feedbackDetails.resonanceWeight}</span>}{moment.feedbackDetails.replyWeight > 0 && <span>回应 +{moment.feedbackDetails.replyWeight}</span>}{moment.feedbackDetails.positiveCapped && <small>合计按 +5 封顶</small>}</div>
      </div>}
      {moment.feedbackDetails?.negativeWeight < 0 && <div className="feedback-source-detail negative">
        <strong>负反馈来源</strong>
        {moment.feedbackDetails.negativeReasons.map((reason, index) => <p key={`${reason.label}-${index}`}>{reason.label} <b>{reason.weight}</b></p>)}
        {moment.feedbackDetails.negativeCapped && <small>合计按 -5 封顶</small>}
      </div>}
      {!moment.feedbackWeight && <p>你还没有产生会影响这类内容排序的互动或负反馈。</p>}
    </>,
  };
  const rows = [
    { id: 'mood', label: '心情匹配', score: moment.scoreBreakdown?.mood || 0 },
    { id: 'topic', label: '话题匹配', score: moment.scoreBreakdown?.topic || 0 },
    { id: 'time', label: '发布时间', score: moment.scoreBreakdown?.time || 0 },
    { id: 'location', label: '位置辅助', score: moment.scoreBreakdown?.location || 0 },
    { id: 'feedback', label: '行为反馈', score: moment.feedbackWeight || 0 },
  ];
  return (
    <div className="feedback-backdrop" onClick={onClose}>
      <section className="explain-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="feedback-sheet-head"><strong>推荐机制</strong><button className="icon-button" onClick={onClose} aria-label="关闭"><X size={19} /></button></div>
        <div className="explain-summary">
          <div><span>同频分</span><strong>{moment.matchScore}</strong></div>
          <div><span>反馈权重</span><strong>{moment.feedbackWeight > 0 ? '+' : ''}{moment.feedbackWeight || 0}</strong></div>
          <div><span>排序分</span><strong>{moment.rankingScore}</strong></div>
        </div>
        <div className="explain-accordion">
          {rows.map((row) => <div className={expandedItem === row.id ? 'expanded' : ''} key={row.id}>
            <button onClick={() => setExpandedItem((current) => current === row.id ? null : row.id)} aria-expanded={expandedItem === row.id}>
              <span>{row.label}</span><strong>{row.score > 0 ? '+' : ''}{row.score}</strong><ChevronRight size={15} />
            </button>
            {expandedItem === row.id && <div className="explain-accordion-content">{details[row.id]}</div>}
          </div>)}
        </div>
        <p>同频分决定推荐资格和档位，行为反馈只调整内容顺序。</p>
      </section>
    </div>
  );
}

function App({ currentUser, onSignOut }) {
  const storageKey = (name) => `${name}:${currentUser.id}`;
  const previewParams = new URLSearchParams(window.location.search);
  const initialTab = ['home', 'messages', 'memory', 'profile'].includes(previewParams.get('tab')) ? previewParams.get('tab') : 'home';
  const [tab, setTab] = useState(initialTab);
  const [moments, setMoments] = useState(loadSampleMoments);
  const [reacted, setReacted] = useState([]);
  const [replyThreads, setReplyThreads] = useState(() => {
    try {
      const storedThreads = JSON.parse(window.localStorage.getItem(storageKey('yitian-reply-threads')) || 'null');
      const accountThreads = databaseEnabled ? (storedThreads || []).filter((thread) => !isSeededReplyThread(thread)) : (storedThreads || initialReplyThreads);
      return accountThreads.map((thread) => ({
        ...thread,
        sourceOwner: thread.sourceOwner || (thread.messages[0]?.sender === 'me' ? 'them' : 'me'),
      }));
    } catch {
      return databaseEnabled ? [] : initialReplyThreads;
    }
  });
  const [resonanceNotifications, setResonanceNotifications] = useState([]);
  const [recommendationFeedback, setRecommendationFeedback] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem(storageKey('yitian-recommendation-feedback')) || '[]');
    } catch {
      return [];
    }
  });
  const [pendingFeedback, setPendingFeedback] = useState(null);
  const [debugMode, setDebugMode] = useState(() => window.localStorage.getItem('yitian-recommendation-debug') === '1');
  const [explainingMoment, setExplainingMoment] = useState(null);
  const [composing, setComposing] = useState(previewParams.get('compose') === '1');
  const [replying, setReplying] = useState(null);
  const [editingMoment, setEditingMoment] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [archivedMoments, setArchivedMoments] = useState(() => loadAccountMemorySamples(currentUser.id));
  const [hiddenMemoryIds, setHiddenMemoryIds] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem(storageKey('yitian-hidden-memories')) || '[]');
    } catch {
      return [];
    }
  });
  const [now, setNow] = useState(Date.now());
  const [toastMessage, setToastMessage] = useState('');
  const [defaultVisibility, setDefaultVisibility] = useState(() => window.localStorage.getItem(storageKey('yitian-default-visibility')) || '同频的人');
  const [savedDrafts, setSavedDrafts] = useState(() => {
    try {
      const storedDrafts = window.localStorage.getItem(storageKey('yitian-drafts'));
      if (storedDrafts) return JSON.parse(storedDrafts);
      const legacyDraft = window.localStorage.getItem('tongpin-draft');
      if (!legacyDraft) return [];
      const migrated = { ...JSON.parse(legacyDraft), id: `draft-${Date.now()}` };
      window.localStorage.setItem(storageKey('yitian-drafts'), JSON.stringify([migrated]));
      window.localStorage.removeItem('tongpin-draft');
      return [migrated];
    } catch {
      return [];
    }
  });
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [composeSeed, setComposeSeed] = useState(null);
  const [momentsLoaded, setMomentsLoaded] = useState(false);
  const [coldStartPreference, setColdStartPreference] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem(storageKey('yitian-cold-start')) || 'null');
    } catch {
      return null;
    }
  });
  const scrollAreaRef = useRef(null);
  useEffect(() => {
    if (!databaseEnabled) return undefined;
    let cancelled = false;
    const localKey = storageKey('yitian-drafts');
    const migrationKey = storageKey('yitian-drafts-cloud-migrated');
    loadDatabaseDrafts()
      .then(async ({ drafts: databaseDrafts }) => {
        if (cancelled) return;
        let nextDrafts = databaseDrafts;
        if (window.localStorage.getItem(migrationKey) !== '1') {
          const localDrafts = JSON.parse(window.localStorage.getItem(localKey) || '[]');
          const draftsById = new Map(databaseDrafts.map((draft) => [draft.id, draft]));
          localDrafts.forEach((draft) => {
            const remote = draftsById.get(draft.id);
            if (!remote || new Date(draft.savedAt || 0) > new Date(remote.savedAt || 0)) draftsById.set(draft.id, draft);
          });
          nextDrafts = [...draftsById.values()]
            .sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0))
            .slice(0, 10);
          if (localDrafts.length) await saveDatabaseDrafts(nextDrafts);
          window.localStorage.setItem(migrationKey, '1');
        }
        if (cancelled) return;
        setSavedDrafts(nextDrafts);
        window.localStorage.setItem(localKey, JSON.stringify(nextDrafts));
      })
      .catch((error) => console.error('加载云端草稿失败，继续使用本地草稿', error));
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    scrollAreaRef.current?.scrollTo({ top: 0 });
  }, [tab]);
  useEffect(() => {
    const syncProfile = (event) => {
      const profile = event.detail || getLocalProfile(currentUser.id);
      const applyProfile = (moment) => moment.isMine ? { ...moment, user: profile.name, avatar: profile.name.slice(0, 1), avatarUrl: profile.avatar || '' } : moment;
      setMoments((current) => current.map(applyProfile));
      setArchivedMoments((current) => {
        const updated = current.map(applyProfile);
        const samples = loadAccountMemorySamples(currentUser.id);
        return [...updated.filter((moment) => !moment.isDemo), ...samples];
      });
    };
    window.addEventListener('yitian-profile-updated', syncProfile);
    syncProfile({ detail: getLocalProfile(currentUser.id) });
    return () => window.removeEventListener('yitian-profile-updated', syncProfile);
  }, []);
  useEffect(() => {
    if (!reacted.length) return;
    setArchivedMoments((current) => current.map((moment) => reacted.includes(moment.id) && Number(moment.reactions || 0) === 0 ? { ...moment, reactions: 1 } : moment));
  }, [reacted]);
  useEffect(() => {
    if (!databaseEnabled) return undefined;
    let cancelled = false;
    let refreshing = false;
    let firstLoadFinished = false;
    const refreshMoments = async () => {
      if (refreshing || document.visibilityState === 'hidden') return;
      refreshing = true;
      try {
        const data = await loadDatabaseMoments();
        if (cancelled || !data) return;
        const localProfile = getLocalProfile(currentUser.id);
        const activeMoments = data.active.map((moment) => ({
          ...moment,
          user: moment.isMine ? localProfile.name : moment.user,
          avatar: moment.isMine ? localProfile.name.slice(0, 1) : moment.avatar,
          avatarUrl: moment.isMine ? localProfile.avatar || '' : moment.avatarUrl,
          image: moment.image || (moment.hasPhoto ? rainyCommute : null),
        }));
        setMoments([...activeMoments, ...loadSampleMoments()]);
        setReacted(data.reactedMomentIds || []);
        setArchivedMoments([
          ...data.archived.map((moment) => ({
            ...moment,
            user: localProfile.name,
            avatar: localProfile.name.slice(0, 1),
            avatarUrl: localProfile.avatar || '',
            image: moment.image || (moment.hasPhoto ? rainyCommute : null),
          })),
          ...loadAccountMemorySamples(currentUser.id),
        ]);
      } catch (error) {
        console.error('加载数据库失败', error);
        if (!cancelled && !firstLoadFinished) toast('数据库连接失败，已使用演示数据');
      } finally {
        refreshing = false;
        if (!cancelled && !firstLoadFinished) {
          firstLoadFinished = true;
          setMomentsLoaded(true);
        }
      }
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refreshMoments();
    };
    refreshMoments();
    const refreshTimer = window.setInterval(refreshMoments, 10_000);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);
  useEffect(() => {
    if (!databaseEnabled) return undefined;
    let cancelled = false;
    const refreshResonance = () => loadResonanceNotifications()
      .then((notifications) => { if (!cancelled) setResonanceNotifications(notifications); })
      .catch((error) => console.error('加载共鸣通知失败', error));
    refreshResonance();
    const refreshTimer = window.setInterval(refreshResonance, 5000);
    return () => { cancelled = true; window.clearInterval(refreshTimer); };
  }, []);
  useEffect(() => {
    if (!databaseEnabled) return undefined;
    let cancelled = false;
    loadRecommendationFeedback()
      .then((rows) => {
        if (cancelled) return;
        const databaseFeedback = rows.map((row) => ({
          id: row.id,
          feedbackType: row.feedback_type,
          targetKey: row.target_key,
          targetUserId: row.target_user_id,
          topic: row.topic,
          mood: row.mood,
          sourceMomentId: row.source_moment_id,
          expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : null,
          persisted: true,
        }));
        setRecommendationFeedback((current) => [...databaseFeedback, ...current.filter((item) => !item.persisted)]);
      })
      .catch((error) => console.error('加载推荐反馈失败，请确认已执行 007_recommendation_feedback.sql', error));
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!databaseEnabled) return undefined;
    let cancelled = false;
    const refreshReplyThreads = () => loadReplyThreads()
      .then((databaseThreads) => {
        if (cancelled) return;
        setReplyThreads((current) => {
          const next = [...databaseThreads, ...current.filter((thread) => !thread.persisted && !isSeededReplyThread(thread))];
          window.localStorage.setItem(storageKey('yitian-reply-threads'), JSON.stringify(next));
          return next;
        });
      })
      .catch((error) => console.error('加载回应失败，请确认已执行 003_reply_threads.sql', error));
    refreshReplyThreads();
    const refreshTimer = window.setInterval(refreshReplyThreads, 5000);
    return () => { cancelled = true; window.clearInterval(refreshTimer); };
  }, []);
  useEffect(() => {
    const expireMoments = () => {
      const currentTime = Date.now();
      setNow(currentTime);
      setMoments((current) => {
        const expired = current.filter((moment) => moment.expiresAt <= currentTime);
        const expiredOwnMoments = expired.filter((moment) => moment.isMine);
        if (expiredOwnMoments.length) {
          setArchivedMoments((archived) => [
            ...expiredOwnMoments.map((moment) => ({ ...moment, archivedAt: currentTime })),
            ...archived,
          ]);
        }
        return expired.length ? current.filter((moment) => moment.expiresAt > currentTime) : current;
      });
    };
    expireMoments();
    const timer = window.setInterval(expireMoments, 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const scoredMoments = useMemo(() => {
    const viewerContexts = moments
      .filter((moment) => moment.isMine)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((moment) => ({ id: moment.id, mood: moment.mood, tags: moment.tags || [], matchCity: moment.matchCity }));
    const scoringContexts = viewerContexts.length
      ? viewerContexts
      : coldStartPreference ? [{ id: 'cold-start', ...coldStartPreference }] : [];
    const activeFeedback = recommendationFeedback.filter((item) => !item.expiresAt || item.expiresAt > now);
    const hiddenUserIds = new Set(activeFeedback.filter((item) => item.feedbackType === 'hide_user').map((item) => String(item.targetKey)));
    return moments
      .filter((moment) => moment.expiresAt > now)
      .filter((moment) => moment.isMine || !hiddenUserIds.has(String(moment.userId)))
      .map((moment) => {
        const scored = scoreMomentAgainstContexts(moment, scoringContexts, now);
        const feedbackDetails = moment.isMine ? null : feedbackWeightFor(moment, activeFeedback, moments, reacted, replyThreads, now);
        const feedbackWeight = feedbackDetails?.total || 0;
        return { ...scored, feedbackWeight, feedbackDetails, rankingScore: (scored.matchScore ?? 11) + feedbackWeight };
      })
      .sort((a, b) => b.rankingScore - a.rankingScore || b.createdAt - a.createdAt);
  }, [moments, now, coldStartPreference, recommendationFeedback, reacted, replyThreads]);
  const recommendedMoments = useMemo(
    () => {
      const hiddenMomentIds = new Set(recommendationFeedback
        .filter((item) => item.feedbackType === 'hide_moment' && (!item.expiresAt || item.expiresAt > now))
        .map((item) => String(item.targetKey)));
      return scoredMoments.filter((moment) => moment.isRecommended && !hiddenMomentIds.has(String(moment.id)));
    },
    [scoredMoments, recommendationFeedback, now],
  );
  const toast = (message) => { setToastMessage(message); window.clearTimeout(window.__toastTimer); window.__toastTimer = window.setTimeout(() => setToastMessage(''), 2200); };
  const toggleDebugMode = () => {
    setDebugMode((current) => {
      const next = !current;
      window.localStorage.setItem('yitian-recommendation-debug', next ? '1' : '0');
      return next;
    });
  };
  useEffect(() => {
    window.localStorage.setItem(storageKey('yitian-recommendation-feedback'), JSON.stringify(recommendationFeedback));
  }, [recommendationFeedback]);
  const storeFeedback = async (feedback, moment) => {
    setRecommendationFeedback((current) => [feedback, ...current.filter((item) => !(item.feedbackType === feedback.feedbackType && item.targetKey === feedback.targetKey))]);
    if (!databaseEnabled || !moment.persisted) return;
    try {
      const saved = await saveRecommendationFeedback(feedback);
      setRecommendationFeedback((current) => current.map((item) => item.feedbackType === feedback.feedbackType && item.targetKey === feedback.targetKey ? { ...item, id: saved.id, persisted: true } : item));
    } catch (error) {
      console.error('保存推荐反馈失败，请确认已执行 007_recommendation_feedback.sql', error);
      toast('反馈已在本机生效，登录同步暂不可用');
    }
  };
  const removeFeedback = async (feedback) => {
    setRecommendationFeedback((current) => current.filter((item) => !(item.feedbackType === feedback.feedbackType && item.targetKey === feedback.targetKey)));
    if (!databaseEnabled || !feedback.moment?.persisted) return;
    try {
      await deleteRecommendationFeedback(feedback.feedbackType, feedback.targetKey);
    } catch (error) {
      console.error('撤销推荐反馈失败', error);
      toast('撤销同步失败，请稍后重试');
    }
  };
  const beginFeedback = (moment, feedbackType) => {
    const targetKey = String(feedbackType === 'hide_user' ? moment.userId : moment.id);
    const feedback = {
      feedbackType,
      targetKey,
      targetUserId: feedbackType === 'hide_user' && moment.persisted ? moment.userId : null,
      sourceMomentId: moment.persisted ? moment.id : null,
      persisted: false,
    };
    storeFeedback(feedback, moment);
    setPendingFeedback({ ...feedback, moment });
  };
  const addFeedbackReason = (feedbackType) => {
    if (!pendingFeedback) return;
    const { moment } = pendingFeedback;
    const topic = moment.tags?.[0] || null;
    const targetKey = feedbackType === 'mood' ? moment.mood : topic;
    if (!targetKey) {
      toast('这条内容没有可反馈的话题');
      return;
    }
    storeFeedback({
      feedbackType,
      targetKey,
      topic: feedbackType === 'topic' || feedbackType === 'repeat' ? topic : null,
      mood: feedbackType === 'mood' ? moment.mood : null,
      sourceMomentId: moment.persisted ? moment.id : null,
      expiresAt: feedbackType === 'repeat' ? Date.now() + DAY_MS : null,
      persisted: false,
    }, moment);
    setPendingFeedback(null);
    toast('已调整后续推荐');
  };
  const updateReplyThreads = (updater) => {
    setReplyThreads((current) => {
      const next = updater(current);
      window.localStorage.setItem(storageKey('yitian-reply-threads'), JSON.stringify(next));
      return next;
    });
  };
  const appendReply = (thread, message) => {
    updateReplyThreads((current) => current.map((item) => item.id === thread.id ? { ...item, messages: [...item.messages, message] } : item));
  };
  const sendReplyToThread = async (thread, body) => {
    if (Date.now() >= thread.expiresAt) {
      toast('这条此刻已经结束');
      return false;
    }
    try {
      const message = thread.persisted
        ? await sendDatabaseReply({ momentId: thread.momentId, receiverId: thread.otherId, body })
        : { id: `local-reply-${Date.now()}`, body, sender: 'me', createdAt: Date.now(), readAt: null };
      appendReply(thread, message);
      toast('回复已送达');
      return true;
    } catch (error) {
      console.error('回复失败', error);
      toast('回复失败，请稍后重试');
      return false;
    }
  };
  const sendReplyToMoment = async (moment, body) => {
    const otherId = moment.userId || `mock-user-${moment.id}`;
    let thread = replyThreads.find((item) => item.momentId === moment.id && item.otherId === otherId);
    if (!thread) {
      thread = {
        id: `${moment.id}:${otherId}`,
        momentId: moment.id,
        otherId,
        user: moment.user,
        avatar: moment.avatar,
        avatarUrl: moment.avatarUrl,
        color: moment.color,
        source: moment.text,
        sourceOwner: 'them',
        expiresAt: moment.expiresAt,
        unread: false,
        persisted: Boolean(moment.persisted && moment.userId),
        messages: [],
      };
      updateReplyThreads((current) => [thread, ...current]);
    }
    return sendReplyToThread(thread, body);
  };
  const readReplyThread = async (thread) => {
    updateReplyThreads((current) => current.map((item) => item.id === thread.id ? { ...item, unread: false } : item));
    if (thread.persisted && thread.unread) {
      try {
        await markDatabaseThreadRead(thread.momentId, thread.otherId);
      } catch (error) {
        console.error('标记回应已读失败', error);
      }
    }
  };
  const readResonance = async (reactionId) => {
    setResonanceNotifications((current) => current.map((message) => message.id === reactionId ? { ...message, unread: false } : message));
    try {
      await markDatabaseResonanceRead([reactionId]);
    } catch (error) {
      console.error('标记共鸣已读失败，请确认已执行 006_reaction_read_state.sql', error);
      toast('标记已读失败，请稍后重试');
    }
  };
  const readAllNotifications = async () => {
    const unreadThreads = replyThreads.filter((thread) => thread.unread);
    const unreadResonanceIds = resonanceNotifications.filter((message) => message.unread).map((message) => message.id);
    updateReplyThreads((current) => current.map((thread) => ({ ...thread, unread: false })));
    setResonanceNotifications((current) => current.map((message) => ({ ...message, unread: false })));
    await Promise.all([
      ...unreadThreads.filter((thread) => thread.persisted).map((thread) => markDatabaseThreadRead(thread.momentId, thread.otherId).catch((error) => console.error('标记回应已读失败', error))),
      ...(unreadResonanceIds.length ? [markDatabaseResonanceRead(unreadResonanceIds).catch((error) => console.error('标记共鸣已读失败', error))] : []),
    ]);
    toast(unreadThreads.length || unreadResonanceIds.length ? '已全部标为已读' : '暂无未读消息');
  };
  const openMomentReply = (moment) => {
    if (moment.isMine) {
      setTab('messages');
      return;
    }
    setReplying(moment);
  };
  const toggleReaction = async (id) => {
    const target = moments.find((moment) => moment.id === id);
    if (!target) return;
    const wasReacted = reacted.includes(id);
    const nextActive = !wasReacted;
    const applyReaction = (count) => {
      setReacted((current) => nextActive ? [...new Set([...current, id])] : current.filter((item) => item !== id));
      setMoments((current) => current.map((moment) => moment.id === id ? { ...moment, reactions: count } : moment));
    };
    if (databaseEnabled && target.persisted) {
      try {
        const count = await setDatabaseReaction(id, nextActive);
        applyReaction(count);
      } catch (error) {
        console.error('共鸣操作失败', error);
        toast('操作失败，请稍后重试');
      }
      return;
    }
    applyReaction(Math.max(0, Number(target.reactions || 0) + (nextActive ? 1 : -1)));
  };
  const publish = async ({ text, mood, tags, images, image, hasPhoto, visibility, location }) => {
    const createdAt = Date.now();
    const localProfile = getLocalProfile(currentUser.id);
    let nextMoment = { id: createdAt, user: localProfile.name, avatar: localProfile.name.slice(0, 1), avatarUrl: localProfile.avatar || '', city: location === '不展示位置' ? '广州' : location, matchCity: location === '不展示位置' ? '' : '广州', createdAt, expiresAt: createdAt + DAY_MS, mood, text, tags, match: '我的此刻', matchLevel: 'own', matchScore: null, reasons: [], reactions: 0, color: '#d95f45', images: images || [], image: image || null, hasPhoto, visibility, location, isMine: true };
    if (databaseEnabled) {
      try {
        const savedMoment = await createMoment(nextMoment);
        nextMoment = { ...savedMoment, user: localProfile.name, avatar: localProfile.name.slice(0, 1), avatarUrl: localProfile.avatar || '' };
      } catch (error) {
        console.error('发布失败', error);
        toast('发布失败，请检查数据库连接');
        return;
      }
    }
    if (visibility === '仅自己') {
      setArchivedMoments((current) => [{ ...nextMoment, archivedAt: Date.now() }, ...current]);
      setTab('memory');
      toast('已保存到私人回声');
    } else {
      setMoments((current) => [nextMoment, ...current]);
      setTab('home');
      toast('此刻已发布');
    }
    setComposing(false);
    if (activeDraftId) {
      setSavedDrafts((current) => {
        const next = current.filter((draft) => draft.id !== activeDraftId);
        window.localStorage.setItem(storageKey('yitian-drafts'), JSON.stringify(next));
        if (databaseEnabled) saveDatabaseDrafts(next).catch((error) => console.error('清理云端草稿失败', error));
        return next;
      });
      setActiveDraftId(null);
    }
  };
  const editMoment = (moment) => {
    setEditingMoment(moment);
    setComposing(true);
  };
  const updateMoment = async (changes) => {
    const updated = { ...editingMoment, ...changes, images: changes.images || [], image: changes.images?.[0] || null, city: changes.location === '不展示位置' ? '广州' : changes.location, matchCity: changes.location === '不展示位置' ? '' : '广州', isEdited: true };
    if (databaseEnabled && editingMoment.persisted) {
      try {
        await updateDatabaseMoment(editingMoment.id, updated);
      } catch (error) {
        console.error('修改失败', error);
        toast('修改失败，请稍后重试');
        return;
      }
    }
    if (changes.visibility === '仅自己') {
      setMoments((current) => current.filter((item) => item.id !== editingMoment.id));
      setArchivedMoments((current) => [{ ...updated, archivedAt: Date.now() }, ...current]);
      setTab('memory');
      toast('修改已保存并转入回声');
    } else {
      setMoments((current) => current.map((item) => item.id === editingMoment.id ? updated : item));
      toast('修改已保存，公开时间不变');
    }
    setEditingMoment(null);
    setComposing(false);
  };
  const archiveMoment = async (moment) => {
    if (databaseEnabled && moment.persisted) {
      try {
        await archiveDatabaseMoment(moment.id);
      } catch (error) {
        console.error('归档失败', error);
        toast('归档失败，请稍后重试');
        return;
      }
    }
    setMoments((current) => current.filter((item) => item.id !== moment.id));
    setArchivedMoments((current) => [{ ...moment, archivedAt: Date.now() }, ...current]);
    toast('已提前归档到回声');
  };
  const confirmDelete = async () => {
    if (databaseEnabled && deleteTarget.persisted) {
      try {
        await deleteDatabaseMoment(deleteTarget.id);
      } catch (error) {
        console.error('删除失败', error);
        toast('删除失败，请稍后重试');
        return;
      }
    }
    if (deleteTarget.isMemory) {
      setArchivedMoments((current) => current.filter((item) => item.id !== deleteTarget.id));
      setHiddenMemoryIds((current) => {
        const next = [...new Set([...current, deleteTarget.id])];
        window.localStorage.setItem(storageKey('yitian-hidden-memories'), JSON.stringify(next));
        return next;
      });
    } else {
      setMoments((current) => current.filter((item) => item.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
    toast('记录已删除');
  };
  const saveDraft = (draftData) => {
    if (!activeDraftId && savedDrafts.length >= 10) {
      toast('最多保存 10 篇草稿，请先清理');
      return;
    }
    const savedAt = new Date();
    const id = activeDraftId || `draft-${savedAt.getTime()}`;
    const nextDraft = { ...draftData, id, savedAt: savedAt.toISOString(), savedAtLabel: `今天 ${savedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}` };
    setSavedDrafts((current) => {
      const next = [nextDraft, ...current.filter((draft) => draft.id !== id)];
      window.localStorage.setItem(storageKey('yitian-drafts'), JSON.stringify(next));
      if (databaseEnabled) saveDatabaseDrafts(next).catch((error) => { console.error('保存云端草稿失败', error); toast('草稿已保存在本机，云端同步失败'); });
      return next;
    });
    setActiveDraftId(null);
    setComposing(false);
    toast('草稿已保存');
  };
  const clearDraft = (draftId = activeDraftId) => {
    if (!draftId) return;
    setSavedDrafts((current) => {
      const next = current.filter((draft) => draft.id !== draftId);
      window.localStorage.setItem(storageKey('yitian-drafts'), JSON.stringify(next));
      if (databaseEnabled) saveDatabaseDrafts(next).catch((error) => { console.error('删除云端草稿失败', error); toast('本机草稿已删除，云端同步失败'); });
      return next;
    });
    if (activeDraftId === draftId) setActiveDraftId(null);
    toast('草稿已删除');
  };
  const startNewMoment = () => {
    setEditingMoment(null);
    setActiveDraftId(null);
    setComposeSeed(null);
    setComposing(true);
  };
  const startTopicMoment = (topic) => {
    setEditingMoment(null);
    setActiveDraftId(null);
    setComposeSeed({ text: `#${topic} `, tags: [topic], isTopicSeed: true });
    setComposing(true);
  };
  const editDraft = (draftId) => {
    setEditingMoment(null);
    setActiveDraftId(draftId);
    setComposing(true);
  };
  const activeDraft = savedDrafts.find((draft) => draft.id === activeDraftId) || null;
  const changeDefaultVisibility = (visibility) => {
    setDefaultVisibility(visibility);
    window.localStorage.setItem(storageKey('yitian-default-visibility'), visibility);
    toast(`默认可见范围已设为${visibility}`);
  };
  const saveColdStartPreference = (preference) => {
    setColdStartPreference(preference);
    window.localStorage.setItem(storageKey('yitian-cold-start'), JSON.stringify(preference));
    toast('已按你的选择更新推荐');
  };
  const hasActiveOwnMoment = moments.some((moment) => moment.isMine && moment.expiresAt > now);
  const profileStats = useMemo(() => {
    const ownRecords = [...moments, ...archivedMoments].filter((moment) => moment.isMine && !hiddenMemoryIds.includes(moment.id));
    const uniqueRecords = [...new Map(ownRecords.map((moment) => [String(moment.id), moment])).values()];
    const recordedDays = new Set(uniqueRecords.map((moment) => {
      const date = new Date(moment.createdAt);
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }));
    return {
      moments: uniqueRecords.length,
      reactions: uniqueRecords.reduce((total, moment) => total + Number(moment.reactions || 0), 0),
      days: recordedDays.size,
      daysSinceLast: uniqueRecords.length ? Math.max(0, Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(Math.max(...uniqueRecords.map((moment) => moment.createdAt))).setHours(0, 0, 0, 0)) / DAY_MS)) : null,
    };
  }, [moments, archivedMoments, hiddenMemoryIds]);
  const view = useMemo(() => {
    if (tab === 'home') return <HomeView moments={recommendedMoments} topicMoments={scoredMoments} reacted={reacted} replyThreads={replyThreads} onReact={toggleReaction} onReply={openMomentReply} onEdit={editMoment} onArchive={archiveMoment} onDelete={setDeleteTarget} onFeedback={beginFeedback} debugMode={debugMode} onExplain={setExplainingMoment} onStartTopic={startTopicMoment} toast={toast} />;
    if (tab === 'messages') return <MessagesView toast={toast} replyThreads={replyThreads} resonanceMessages={resonanceNotifications} onSendReply={sendReplyToThread} onReadThread={readReplyThread} onReadResonance={readResonance} onReadAll={readAllNotifications} ownProfile={getLocalProfile(currentUser.id)} />;
    if (tab === 'memory') return <MemoryView archivedMoments={archivedMoments} hiddenMemoryIds={hiddenMemoryIds} onDelete={setDeleteTarget} />;
    return <ProfileView onCompose={startNewMoment} onEditDraft={editDraft} toast={toast} drafts={savedDrafts} onDeleteDraft={clearDraft} stats={profileStats} defaultVisibility={defaultVisibility} onDefaultVisibilityChange={changeDefaultVisibility} currentUser={currentUser} onSignOut={onSignOut} debugMode={debugMode} onToggleDebugMode={toggleDebugMode} />;
  }, [tab, recommendedMoments, scoredMoments, reacted, savedDrafts, archivedMoments, hiddenMemoryIds, replyThreads, resonanceNotifications, profileStats, defaultVisibility, currentUser, onSignOut, debugMode]);
  return (
    <div className="app-shell">
      <main ref={scrollAreaRef}>{view}</main>
      <BottomNav tab={tab} onChange={setTab} onCompose={startNewMoment} unreadCount={replyThreads.filter((thread) => thread.unread).length + resonanceNotifications.filter((message) => message.unread).length} />
      {composing && <Composer key={editingMoment?.id || activeDraftId || composeSeed?.tags?.[0] || 'new'} onClose={() => { setComposing(false); setEditingMoment(null); setActiveDraftId(null); setComposeSeed(null); }} onPublish={publish} onUpdate={updateMoment} onDraft={saveDraft} draft={activeDraft || composeSeed} editingMoment={editingMoment} onClearDraft={() => clearDraft(activeDraftId)} defaultVisibility={defaultVisibility} />}
      {replying && <ReplySheet moment={replying} onClose={() => setReplying(null)} onSend={sendReplyToMoment} />}
      {pendingFeedback && (
        <div className="feedback-backdrop" onClick={() => setPendingFeedback(null)}>
          <section className="feedback-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="feedback-sheet-head">
              <strong>{pendingFeedback.feedbackType === 'hide_user' ? `不再看 ${pendingFeedback.moment.user}` : '已减少此类内容'}</strong>
              <button className="icon-button" onClick={() => setPendingFeedback(null)} aria-label="关闭"><X size={19} /></button>
            </div>
            {pendingFeedback.feedbackType === 'hide_moment' ? <>
              <p>可以告诉我们原因，帮助调整后续推荐</p>
              <div className="feedback-reasons">
                <button disabled={!pendingFeedback.moment.tags?.length} onClick={() => addFeedbackReason('topic')}>不喜欢这个话题<ChevronRight size={16} /></button>
                <button onClick={() => addFeedbackReason('mood')}>不想看这种心情<ChevronRight size={16} /></button>
                <button disabled={!pendingFeedback.moment.tags?.length} onClick={() => addFeedbackReason('repeat')}>类似内容看得太多<ChevronRight size={16} /></button>
              </div>
            </> : <p>该用户发布的内容将不再出现在你的首页和话题页。</p>}
            <button className="feedback-undo" onClick={() => { removeFeedback(pendingFeedback); setPendingFeedback(null); toast('已撤销'); }}>撤销</button>
          </section>
        </div>
      )}
      {explainingMoment && <RecommendationExplainSheet moment={explainingMoment} onClose={() => setExplainingMoment(null)} />}
      {tab === 'home' && momentsLoaded && !hasActiveOwnMoment && !coldStartPreference && <ColdStartSheet onSave={saveColdStartPreference} />}
      {deleteTarget && (
        <div className="confirm-backdrop" onClick={() => setDeleteTarget(null)}>
          <section className="delete-confirm" onClick={(event) => event.stopPropagation()}>
            <div className="delete-icon"><Trash2 size={22} /></div>
            <h2>删除这条记录？</h2>
            <p>内容和收到的回应都会被删除，删除后无法恢复。</p>
            <div><button onClick={() => setDeleteTarget(null)}>取消</button><button className="danger" onClick={confirmDelete}>确认删除</button></div>
          </section>
        </div>
      )}
      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState('login');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    if (mode === 'register' && !nickname.trim()) return setMessage('请输入昵称');
    if (password.length < 6) return setMessage('密码至少需要 6 位');
    if (mode === 'register' && password !== confirmPassword) return setMessage('两次输入的密码不一致');
    setSubmitting(true);
    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { nickname: nickname.trim() } },
        });
        if (error) throw error;
        if (data.session) {
          await supabase.from('profiles').update({ nickname: nickname.trim(), avatar_text: nickname.trim().slice(0, 1) }).eq('id', data.user.id);
        } else {
          setMessage('注册成功，请先到邮箱完成验证');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (error) {
      const authMessages = {
        'Invalid login credentials': '邮箱或密码不正确',
        'User already registered': '该邮箱已经注册',
        'Email not confirmed': '请先完成邮箱验证',
        'Password should be at least 6 characters.': '密码至少需要 6 位',
      };
      setMessage(authMessages[error.message] || error.message || '操作失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="auth-shell">
      <div className="auth-brand"><span>一天</span><p>记录今天，也遇见此刻的共鸣</p></div>
      <div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => changeMode('login')}>登录</button><button className={mode === 'register' ? 'active' : ''} onClick={() => changeMode('register')}>注册</button></div>
      <form className="auth-form" onSubmit={submit}>
        {mode === 'register' && <label><span>昵称</span><input value={nickname} maxLength={8} onChange={(event) => setNickname(event.target.value)} placeholder="怎么称呼你" autoComplete="nickname" /></label>}
        <label><span>邮箱</span><input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" type="email" autoComplete="email" required /></label>
        <label><span>密码</span><input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 6 位" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /></label>
        {mode === 'register' && <label><span>确认密码</span><input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="再次输入密码" type="password" autoComplete="new-password" required /></label>}
        {message && <div className="auth-message">{message}</div>}
        <button className="auth-submit" disabled={submitting}>{submitting ? '请稍候...' : mode === 'login' ? '登录' : '创建账号'}</button>
      </form>
    </div>
  );
}

function Root() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (!databaseEnabled) {
      setLoading(false);
      return undefined;
    }
    const activateUser = async (user) => {
      if (!user || user.is_anonymous) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }
      const nickname = user.user_metadata?.nickname;
      let { data: databaseProfile, error: profileError } = await supabase.from('profiles').select('nickname, signature, avatar_url').eq('id', user.id).maybeSingle();
      if (profileError && /signature/i.test(`${profileError.message} ${profileError.details || ''}`)) {
        const fallbackProfile = await supabase.from('profiles').select('nickname, avatar_url').eq('id', user.id).maybeSingle();
        databaseProfile = fallbackProfile.data;
      }
      const localProfileKey = `yitian-profile:${user.id}`;
      const existingLocalProfile = JSON.parse(window.localStorage.getItem(localProfileKey) || 'null');
      const defaultSignature = '记录今天，也收藏自己';
      const localSignature = existingLocalProfile?.signature;
      let resolvedSignature = databaseProfile?.signature || localSignature || defaultSignature;
      if (databaseProfile?.signature === defaultSignature && localSignature && localSignature !== defaultSignature) {
        const { error: signatureMigrationError } = await supabase.from('profiles').update({ signature: localSignature }).eq('id', user.id);
        if (!signatureMigrationError) resolvedSignature = localSignature;
      }
      window.localStorage.setItem(localProfileKey, JSON.stringify({
        name: databaseProfile?.nickname || nickname || existingLocalProfile?.name || '一天用户',
        signature: resolvedSignature,
        avatar: getProfileAvatarUrl(databaseProfile?.avatar_url) || existingLocalProfile?.avatar || '',
        avatarPath: databaseProfile?.avatar_url || existingLocalProfile?.avatarPath || '',
      }));
      setCurrentUser(user);
      setLoading(false);
    };
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user || null;
      if (user?.is_anonymous) {
        await supabase.auth.signOut();
      }
      await activateUser(user?.is_anonymous ? null : user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      activateUser(session?.user || null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) window.alert(error.message);
  };

  if (loading) return <div className="auth-loading">正在加载...</div>;
  if (!databaseEnabled) return <div className="auth-loading">请先配置 Supabase 环境变量</div>;
  return currentUser ? <App key={currentUser.id} currentUser={currentUser} onSignOut={signOut} /> : <AuthScreen />;
}

createRoot(document.getElementById('root')).render(<Root />);
