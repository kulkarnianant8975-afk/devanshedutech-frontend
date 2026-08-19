import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock, BarChart3, IndianRupee, CheckCircle2, Loader2, ArrowLeft, Download, Phone
} from 'lucide-react';
import { courseService, leadService, settingsService } from '../services/api';
import { getAttribution } from '../lib/attribution';
import { CourseResponseDTO } from '../dtos';

/**
 * One page per course, so an advertisement has somewhere specific to send people.
 *
 * The playbook asks for this because a paid click that lands on the homepage makes the visitor
 * find their own way to the thing the advertisement promised, and most of them do not. Here the
 * course they were shown is the whole page, and the enquiry form is already filled in with it —
 * so the lead arrives knowing which course, from which campaign, without anyone typing it.
 */

const CourseLanding: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [course, setCourse] = useState<CourseResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [brochure, setBrochure] = useState<string | null>(null);

  const [form, setForm] = useState({ fullName: '', mobileNumber: '', education: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let live = true;
    setLoading(true);
    setMissing(false);

    courseService.getBySlug(slug)
      .then(found => {
        if (!live) return;
        setCourse(found);
        // A course-specific syllabus if there is one; the button is simply not drawn if not.
        settingsService.getCourseBrochure(found.id)
          .then(b => live && setBrochure(b.downloadUrl))
          .catch(() => live && setBrochure(null));
      })
      .catch(() => live && setMissing(true))
      .finally(() => live && setLoading(false));

    return () => { live = false; };
  }, [slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    setSubmitting(true);
    setError(null);
    try {
      await leadService.create({
        fullName: form.fullName,
        mobileNumber: form.mobileNumber,
        education: form.education || undefined,
        // The course is carried by the page itself, so it is never mistyped or left blank —
        // which is what made "which course does this lead want" unanswerable before.
        courseInterested: course.name,
        source: 'WEBSITE_FORM',
        sourceDetail: `${course.name} page`,
        ...getAttribution(),
      });
      setSent(true);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(message ?? 'Something went wrong. Please call us instead — we would rather not lose you to a form.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (missing || !course) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-bold text-gray-900">We could not find that course</h1>
        <p className="text-gray-500 max-w-md">
          It may have been renamed or is no longer running. Everything we currently teach is on
          the courses page.
        </p>
        <Link to="/courses" className="mt-2 inline-flex items-center gap-2 text-primary font-semibold">
          <ArrowLeft className="w-4 h-4" /> See all courses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-10 md:py-16">
      <Link to="/courses" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4" /> All courses
      </Link>

      <div className="grid md:grid-cols-5 gap-10">
        {/* What the advertisement promised */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="md:col-span-3"
        >
          {course.category && (
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary mb-2">
              {course.category}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">{course.name}</h1>
          <p className="text-gray-600 leading-relaxed mb-6 whitespace-pre-line">{course.description}</p>

          <dl className="flex flex-wrap gap-x-8 gap-y-3 mb-8">
            {course.duration && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <dt className="sr-only">Duration</dt>
                <dd className="text-sm font-semibold text-gray-800">{course.duration}</dd>
              </div>
            )}
            {course.level && (
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <dt className="sr-only">Level</dt>
                <dd className="text-sm font-semibold text-gray-800">{course.level}</dd>
              </div>
            )}
            {course.price != null && String(course.price).trim() !== '' && (
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-gray-400" />
                <dt className="sr-only">Fee</dt>
                <dd className="text-sm font-semibold text-gray-800">{course.price}</dd>
              </div>
            )}
          </dl>

          {brochure && (
            <a
              href={brochure}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-4 h-4" /> Download the syllabus
            </a>
          )}
        </motion.div>

        {/* The enquiry, kept short on purpose */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="md:col-span-2"
        >
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:sticky md:top-24">
            {sent ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h2 className="font-bold text-gray-900 mb-1">We have your enquiry</h2>
                <p className="text-sm text-gray-500">
                  A counsellor will call you about {course.name}. If you would rather not wait,
                  call us directly.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <h2 className="font-bold text-gray-900">Ask about {course.name}</h2>
                <p className="text-sm text-gray-500 -mt-1 mb-1">
                  Two details and a counsellor will call you back. No fee is charged for the
                  guidance call.
                </p>

                <div>
                  <label htmlFor="fullName" className="sr-only">Your name</label>
                  <input
                    id="fullName" name="fullName" required autoComplete="name"
                    placeholder="Your name"
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label htmlFor="mobileNumber" className="sr-only">Mobile number</label>
                  <input
                    id="mobileNumber" name="mobileNumber" required type="tel"
                    inputMode="numeric" autoComplete="tel"
                    placeholder="Mobile number"
                    value={form.mobileNumber}
                    onChange={e => setForm({ ...form, mobileNumber: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label htmlFor="education" className="sr-only">What you are studying</label>
                  <input
                    id="education" name="education"
                    placeholder="What you are studying (optional)"
                    value={form.education}
                    onChange={e => setForm({ ...form, education: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-orange-600 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Request a call back
                </button>

                <p className="text-xs text-gray-400 text-center pt-1">
                  <Phone className="w-3 h-3 inline mr-1" />
                  We use your number only to talk to you about this course.
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CourseLanding;
