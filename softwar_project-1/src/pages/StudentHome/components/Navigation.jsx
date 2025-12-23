// import { Search, Bell } from 'lucide-react';
// import { Badge } from './ui/badge';
// import { Input } from './ui/input';

// export function Navigation() {
//   return (
//     <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30 ml-60">
//       <div className="px-8 py-4 flex items-center justify-between gap-6">
//         {/* Search Bar - Full Width */}
//         <div className="flex-1">
//           <div className="relative">
//             <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//             <Input
//               type="text"
//               placeholder="Search for lessons, assignments, quizzes, resources, or ask a question..."
//               className="pl-14 pr-6 py-3 w-full rounded-full border-gray-300 bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all"
//             />
//           </div>
//         </div>

//         {/* Right Section */}
//         <div className="flex items-center gap-4 flex-shrink-0">
//           {/* Quick Actions Info */}
//           <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#4F46E5]/10 to-[#9333EA]/10">
//             <span className="text-[#4F46E5]" style={{ fontSize: '13px', fontWeight: '600' }}>
//               📚 5 lessons today
//             </span>
//           </div>

//           {/* Notifications */}
//           <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
//             <Bell className="w-6 h-6 text-gray-600" />
//             <Badge 
//               className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-r from-[#4F46E5] to-[#9333EA] text-white border-2 border-white"
//               style={{ fontSize: '10px' }}
//             >
//               3
//             </Badge>
//           </button>
//         </div>
//       </div>
//     </nav>
//   );
// }
export function Navigation() {
  return (
    <header className="header">
      {/* <div className="header-content">
       
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        </div>
      </div> */}
    </header>
  );
}