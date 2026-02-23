"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  HomeIcon,
  BellIcon,
  UserIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeSolid,
  BellIcon as BellSolid,
  UserIcon as UserSolid,
} from "@heroicons/react/24/solid";

const navItems = [
  {
    name: "Notification",
    href: "/",
    icon: BellIcon,
    activeIcon: BellSolid,
  },
  {
    name: "Attendance",
    href: "/attandance",
    icon: HomeIcon,
    activeIcon: HomeSolid,
    locked: true, // Add locked property
  }
];

export default function Navbar() {
  const pathname = usePathname();

  const handleLockedClick = (e: React.MouseEvent, item: any) => {
    if (item.locked) {
      e.preventDefault();
      alert("⚠️ Attendance feature is currently locked. Please check back later!");
    }
  };

  return (
    <>
      {/* Desktop Navbar */}
      <div className="hidden md:flex fixed top-0 left-0 w-full bg-white shadow-sm z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4 w-full">
          <h1 className="text-xl font-semibold text-gray-800">
           Timely
          </h1>

          <div className="flex gap-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = isActive ? item.activeIcon : item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.locked ? "#" : item.href}
                  onClick={(e) => handleLockedClick(e, item)}
                  className={`flex items-center gap-2 transition relative ${
                    isActive && !item.locked
                      ? "text-blue-600 font-semibold"
                      : item.locked
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:text-blue-500"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                  {item.locked && (
                    <LockClosedIcon className="w-3 h-3 absolute -top-1 -right-4 text-gray-400" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navbar */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t shadow-inner z-50">
        <div className="flex justify-around items-center py-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = isActive ? item.activeIcon : item.icon;

            return (
              <Link
                key={item.name}
                href={item.locked ? "#" : item.href}
                onClick={(e) => handleLockedClick(e, item)}
                className={`flex flex-col items-center text-xs transition relative ${
                  isActive && !item.locked
                    ? "text-blue-600"
                    : item.locked
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-500"
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                {item.name}
                {item.locked && (
                  <LockClosedIcon className="w-3 h-3 absolute -top-1 -right-2 text-gray-400" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}