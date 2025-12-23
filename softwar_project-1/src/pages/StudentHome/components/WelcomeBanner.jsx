import { motion } from 'framer-motion';
import { BookOpen, FileText, Award } from 'lucide-react';
import { Button } from './ui/button';

export function WelcomeBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #4F46E5, #9333EA)',
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-20 w-32 h-32 border-2 border-white rounded-full" />
        <div className="absolute bottom-10 left-20 w-24 h-24 border-2 border-white rounded-full" />
        <div className="absolute top-1/2 right-1/3 w-16 h-16 border-2 border-white rounded-lg rotate-45" />
      </div>

      <div className="relative px-12 py-10 flex items-center justify-between">
        {/* Left Content */}
        <div className="flex-1">
          <h1 className="text-white mb-2" style={{ fontSize: '32px', fontWeight: '700' }}>
            Welcome back, Amira
          </h1>
        

        
        </div>

        {/* Right Illustration */}
        <div className="relative w-64 h-64 ml-8">
          <div className="absolute inset-0 bg-white/10 rounded-full backdrop-blur-sm" />
          <div className="absolute inset-4 flex items-center justify-center">
            <div className="text-white/80">
              <BookOpen className="w-32 h-32" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
