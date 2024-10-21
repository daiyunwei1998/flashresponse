"use client"
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {imageHost} from '@/app/config'

export default function RootLayout({ children }) {
  const pathname = usePathname();  // Gets the current path
  const router = useRouter();      // Use this to navigate between pages

  // Define the sequence of URLs
  const urlSequence = ["/demo/page1", "/demo/page2", "/login"];

  // Find the current page index based on the pathname
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const index = urlSequence.indexOf(pathname);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [pathname]);

  // Move forward in the URL sequence
  const goForward = () => {
    if (currentIndex < urlSequence.length - 1) {
      router.push(urlSequence[currentIndex + 1]);
    }
  };

  // Move backward in the URL sequence
  const goBackward = () => {
    if (currentIndex > 0) {
      router.push(urlSequence[currentIndex - 1]);
    }
  };

  return (
    <html lang="en">
      <body>
        <div style={{ display: "flex", height: "100vh", width: "100vw", position: "relative" }}>
          {/* Left side: Go Backward */}
          <div
            onClick={goBackward}
            style={{
           //   backgroundColor: "red", // for debug
              position: "absolute",
              left: 0,
              bottom: 0,  // Attach to the bottom of the page
              height: "20%",  // Set the height to 20% of the viewport height
              width: "50%",   // Cover the left 50% of the viewport width
              zIndex: 1,
              cursor: "pointer"
            }}
          />
          {/* Right side: Go Forward */}
          <div
            onClick={goForward}
            style={{
        //      backgroundColor: "red", // for debug
              position: "absolute",
              right: 0,
              bottom: 0,  // Attach to the bottom of the page
              height: "20%",  // Set the height to 20% of the viewport height
              width: "50%",   // Cover the right 50% of the viewport width
              zIndex: 1,
              cursor: "pointer"
            }}
          />
          {/* Page content */}
          <div style={{ zIndex: 0, width: "100%", height: "100%" }}>{children}</div>
        </div>
      </body>
    </html>
  );
}
