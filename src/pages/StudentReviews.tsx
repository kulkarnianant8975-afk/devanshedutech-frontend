import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, Quote, Volume2, VolumeX, Loader2, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { resolveImageUrl } from '../utils/imageUtils';

/**
 * The students, in their own words.
 *
 * <p>Built around the shape of the footage rather than against it. These are 1080×1920 reels
 * filmed on a phone, so the page is a wall of portrait cards — the format they were shot in and
 * the format the audience already watches everything else in. Forcing them into a widescreen
 * player would letterbox a student's face between two black bars.</p>
 *
 * <p>Nothing downloads until somebody asks. Three reels are three hundred megabytes, and a page
 * that fetches them on arrival would be slower than every other page on the site combined. Each
 * card shows a still frame — about fifty kilobytes — and the video is requested only on the
 * click that plays it.</p>
 */

interface Review {
  id: string;
  name: string;
  course?: string | null;
  /** What the student wrote. Absent on a video-only review. */
  text?: string | null;
  imageUrl?: string | null;
  /** Absent on a written review. */
  videoUrl?: string | null;
  rating?: number | null;
}

/** Poster frames, matched to a review by the name it was given in the Media Library. */
const POSTERS: Record<string, string> = {
  MSReel4: '/images/reviews/MSReel4.jpg',
  MSReel5: '/images/reviews/MSReel5.jpg',
  MSReel6: '/images/reviews/MSReel6.jpg',
};

/**
 * The still shown before a video plays.
 *
 * <p>A student's own photograph if there is one — it is a better thumbnail than any frame we
 * could pull, because it is the picture they chose. Otherwise a generated poster, matched by the
 * name the video carries.</p>
 */
const posterFor = (review: Review): string | undefined => {
  if (review.imageUrl) return resolveImageUrl(review.imageUrl, 600);
  const match = Object.keys(POSTERS).find(k => review.name.includes(k));
  return match ? POSTERS[match] : undefined;
};

const StudentReviews: React.FC = () => {
  const [playing, setPlaying] = useState<Review | null>(null);

  const { data: reviews = [], isLoading, isError } = useQuery<Review[]>({
    queryKey: ['student-reviews'],
    queryFn: async () => (await api.get('/public/reviews')).data ?? [],
    staleTime: 1000 * 60 * 15,
  });

  return (
    <div className="pt-20 min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-secondary text-white py-20 md:py-28 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary mb-5">
              <Quote size={14} /> Student Reviews
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] mb-5">
              Don&rsquo;t take our word for it.
              <span className="block text-primary">Take theirs.</span>
            </h1>
            <p className="text-lg text-white/70 leading-relaxed max-w-xl">
              Students from Parbhani and around Marathwada, talking about what they learned here
              and where it took them. No scripts, no actors — just a phone and a few honest
              minutes.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── The wall of reels ────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {isLoading && (
            <div className="flex items-center justify-center py-24 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading the reviews…
            </div>
          )}

          {isError && (
            <div className="text-center py-24">
              <p className="text-gray-500">
                The reviews could not be loaded just now. Please refresh, or
                {' '}<Link to="/contact" className="text-primary font-semibold underline">talk to us directly</Link>.
              </p>
            </div>
          )}

          {!isLoading && !isError && reviews.length === 0 && (
            <div className="text-center py-24 max-w-md mx-auto">
              <Quote className="w-10 h-10 text-primary/20 mx-auto mb-4" />
              <p className="text-gray-500">
                Student videos are on their way. In the meantime, come and meet the students in
                person — {' '}
                <Link to="/contact" className="text-primary font-semibold underline">
                  book a campus visit
                </Link>.
              </p>
            </div>
          )}

          {reviews.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {reviews.map((review, index) => (
                <ReelCard
                  key={review.id}
                  review={review}
                  index={index}
                  onPlay={review.videoUrl ? () => setPlaying(review) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Closing call to action ───────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-secondary text-white relative overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-10" />
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            The next one of these could be you.
          </h2>
          <p className="text-white/70 mb-8 leading-relaxed">
            Sit in on a class before you decide anything. It is free, it takes an hour, and you
            will know within ten minutes whether this is for you.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-orange-600 transition-colors">
            <MessageCircle size={18} /> Book a free demo class
          </Link>
        </div>
      </section>

      <AnimatePresence>
        {playing && <Lightbox review={playing} onClose={() => setPlaying(null)} />}
      </AnimatePresence>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────── */

/**
 * A review made of words.
 *
 * <p>Given the same portrait proportion as the video cards so a mixed wall still reads as one
 * grid rather than two designs sharing a page — but light where those are dark, so the eye can
 * tell at a glance which ones will play and which are to be read.</p>
 */
const QuoteCard: React.FC<{ review: Review; index: number }> = ({ review, index }) => (
  <motion.figure
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.45, delay: Math.min(index, 5) * 0.06 }}
    className="relative flex flex-col w-full aspect-[9/16] rounded-3xl overflow-hidden bg-white
      border border-gray-100 shadow-sm p-6 m-0">

    <Quote size={28} className="text-primary/20 shrink-0" aria-hidden="true" />

    <blockquote className="flex-1 mt-3 overflow-hidden">
      <p className="text-gray-700 leading-relaxed text-[15px]">
        &ldquo;{review.text}&rdquo;
      </p>
    </blockquote>

    <figcaption className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-3">
      {review.imageUrl ? (
        <img src={resolveImageUrl(review.imageUrl, 120)} alt=""
          loading="lazy" decoding="async"
          className="w-10 h-10 rounded-full object-cover shrink-0" />
      ) : (
        <span className="w-10 h-10 rounded-full bg-orange-50 text-primary font-bold
          grid place-items-center shrink-0">
          {review.name.trim().charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <p className="font-bold text-sm text-gray-900 truncate">{review.name}</p>
        {review.course && <p className="text-xs text-gray-500 truncate">{review.course}</p>}
      </div>
      {review.rating != null && (
        <span className="ml-auto text-amber-500 text-xs shrink-0"
          aria-label={`${review.rating} out of 5`}>
          {'★'.repeat(review.rating)}
        </span>
      )}
    </figcaption>
  </motion.figure>
);

const ReelCard: React.FC<{ review: Review; index: number; onPlay?: () => void }> = ({
  review, index, onPlay,
}) => {
  const poster = posterFor(review);

  // Most reviews are words. Rendering one as a play button that does nothing would be a lie
  // about what the card does, so a written review gets its own quiet card and stays a div —
  // a button nobody can usefully press is worse than no button.
  if (!review.videoUrl) return <QuoteCard review={review} index={index} />;

  return (
    <motion.button
      type="button"
      onClick={onPlay}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay: Math.min(index, 5) * 0.06 }}
      whileHover={{ y: -6 }}
      aria-label={`Play the review from ${review.name}`}
      className="group relative block w-full aspect-[9/16] rounded-3xl overflow-hidden bg-secondary shadow-sm hover:shadow-2xl transition-shadow duration-300 text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40">

      {poster ? (
        <img
          src={poster}
          alt=""
          loading={index < 3 ? 'eager' : 'lazy'}
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        // No still frame for this one. Rather than an empty box, the card becomes a typographic
        // one — on-brand, deliberate, and indistinguishable from a design decision.
        <div className="absolute inset-0 gradient-bg grid place-items-center">
          <span className="text-white/25 font-bold text-[7rem] leading-none select-none">
            {review.name.trim().charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Enough shading for white text to stay legible over any frame. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

      <div className="absolute inset-0 flex items-center justify-center">
        <span className="w-16 h-16 rounded-full bg-white/95 text-primary grid place-items-center shadow-xl transition-transform duration-300 group-hover:scale-110">
          <Play size={24} className="ml-1" fill="currentColor" />
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-white font-bold text-lg leading-tight">{review.name}</p>
        <p className="text-white/60 text-xs mt-1">Tap to watch · Full HD</p>
      </div>
    </motion.button>
  );
};

/* ────────────────────────────────────────────────────────────────────────── */

const Lightbox: React.FC<{ review: Review; onClose: () => void }> = ({ review, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Muted, because that is the only way a browser will autoplay at all. Starting unmuted
  // meant Chrome refused to play and the reader saw a grey box; the unmute control below
  // is one tap away, which is the trade every video on the web makes.
  const [muted, setMuted] = useState(true);

  // Escape closes it, because a full-screen overlay that traps somebody is worse than no
  // overlay at all.
  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  // React does not always have `muted` set on the element by the time autoplay is evaluated,
  // and an unmuted play() is rejected. Setting it here, then playing, removes that race. A
  // refusal is swallowed: the controls are already on screen, so the reader can just press play.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    // play() returns a promise in current browsers but undefined in older ones and in
    // jsdom, so the result is checked before it is treated as one.
    const started = el.play();
    if (started && typeof started.catch === 'function') started.catch(() => {});
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onKey]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Review from ${review.name}`}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">

      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-[min(430px,92vw)]">

        <video
          ref={videoRef}
          src={review.videoUrl ?? undefined}
          poster={posterFor(review)}
          controls
          autoPlay
          playsInline
          muted={muted}
          // "metadata", not "none". This element also carries autoPlay, and the two flatly
          // contradict each other — "none" tells the browser to fetch nothing, so there was no
          // duration, no first frame and no playback: a grey box reading 0:00. Metadata is a
          // small ranged read now that the file is faststart, and the rest still streams.
          preload="metadata"
          className="w-full aspect-[9/16] rounded-2xl bg-black object-cover shadow-2xl"
        />

        <div className="flex items-center justify-between mt-4 gap-3">
          <div className="min-w-0">
            <p className="text-white font-bold truncate">{review.name}</p>
            <p className="text-white/50 text-xs">1080 × 1920 · Full HD</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setMuted(m => !m)}
              aria-label={muted ? 'Unmute' : 'Mute'}
              className="w-10 h-10 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-10 h-10 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StudentReviews;
