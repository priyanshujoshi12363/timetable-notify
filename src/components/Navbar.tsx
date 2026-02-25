"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  HomeIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeSolid,
  BellIcon as BellSolid,
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
  }
];

export default function Navbar() {
  const pathname = usePathname();

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
                  href={item.href}
                  className={`flex items-center gap-2 transition ${
                    isActive
                      ? "text-blue-600 font-semibold"
                      : "text-gray-500 hover:text-blue-500"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
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
                href={item.href}
                className={`flex flex-col items-center text-xs transition ${
                  isActive
                    ? "text-blue-600"
                    : "text-gray-500"
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}