import React from "react";

/**
 * Eventra Brand Logo
 * Styled lockup:
 * - Green 3-wave stylized "E" mark (#22c55e)
 * - "ventra" in bold white lowercase (#ffffff)
 */
export default function EventraLogo({ height = 28, style = {}, className = "" }) {
    // Proportional width for the 175:56 aspect ratio (~3.125)
    const width = Math.round((height * 175) / 56);

    return (
        <svg
            viewBox="0 0 175 56"
            height={height}
            width={width}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={{ display: "inline-block", verticalAlign: "middle", overflow: "visible", ...style }}
            aria-label="Eventra"
        >
            {/* Stylized Green 'E' (Speed wave mark) */}
            <g fill="#22c55e" stroke="#22c55e" strokeWidth="1.2" strokeLinejoin="round">
                {/* Top Bar */}
                <path d="M 54,3 L 54,4 L 53,5 L 53,6 L 53,7 L 52,8 L 52,9 L 52,10 L 51,11 L 51,12 L 49,13 L 48,14 L 13,15 L 12,16 L 7,16 L 3,15 L 3,14 L 3,13 L 3,12 L 4,11 L 4,10 L 4,9 L 5,8 L 5,7 L 6,6 L 7,5 L 8,4 L 10,3 Z" />
                {/* Middle Bar */}
                <path d="M 44,23 L 44,24 L 44,25 L 44,26 L 43,27 L 43,28 L 43,29 L 42,30 L 42,31 L 41,32 L 38,33 L 18,34 L 7,34 L 7,33 L 7,32 L 8,31 L 8,30 L 8,29 L 9,28 L 9,27 L 10,26 L 11,25 L 12,24 L 14,23 Z" />
                {/* Bottom Bar */}
                <path d="M 51,41 L 52,42 L 52,43 L 52,44 L 51,45 L 51,46 L 51,47 L 50,48 L 50,49 L 49,50 L 48,51 L 47,52 L 45,53 L 3,53 L 2,52 L 2,51 L 2,50 L 3,49 L 3,48 L 3,47 L 4,46 L 4,45 L 5,44 L 6,43 L 7,42 L 49,41 Z" />
            </g>

            {/* Wordmark: ventra in bold white */}
            <text
                x="65"
                y="52"
                fontFamily="'Satoshi', 'General Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                fontWeight="900"
                fontSize="45"
                letterSpacing="-2.2px"
                fill="#ffffff"
            >
                ventra
            </text>
        </svg>
    );
}

