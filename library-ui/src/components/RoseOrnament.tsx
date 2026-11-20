import React from 'react';

interface RoseOrnamentProps {
  className?: string;
  width?: number | string;
}

/**
 * Faithful fine-line & solid-petal SVG recreation of the user's rose & tendrils motif.
 */
export const RoseOrnament: React.FC<RoseOrnamentProps> = ({ className, width = 260 }) => (
  <svg
    width={width}
    viewBox="0 0 360 76"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* ===== LEFT TENDRILS (shallow upper wave + lower inward hook) ===== */}
    {/* Main upper-left flowing wave tapering up-left */}
    <path
      d="M148 39 C136 33, 122 33, 108 38 C94 43, 76 42, 58 34 C46 29, 36 27, 26 24"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Subtle secondary inner wisp on the left wave */}
    <path
      d="M114 36 C100 33, 86 34, 72 36"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    {/* Lower-left sweeping hook curving down, left, and curling back right */}
    <path
      d="M148 39 C134 40, 120 44, 110 49 C102 53, 98 56, 103 58 C109 60, 118 57, 127 54"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* ===== CENTER ROSEBUD (solid filled organic petals with negative-space gaps) ===== */}
    <g fill="currentColor">
      {/* Top-left curved outer petal */}
      <path d="M167 30 C168 22, 176 19, 185 20 C189 21, 191 23, 189 25 C184 26, 176 26, 172 32 C170 35, 166 34, 167 30 Z" />
      {/* Right bold outer crescent petal */}
      <path d="M192 24 C198 28, 200 37, 197 46 C195 51, 190 55, 185 56 C182 56, 182 52, 185 50 C190 46, 192 38, 190 31 C189 27, 190 23, 192 24 Z" />
      {/* Bottom-left rounded base petal */}
      <path d="M164 38 C163 46, 167 54, 175 56 C179 57, 182 55, 180 52 C175 49, 171 45, 170 39 C169 36, 164 35, 164 38 Z" />
      {/* Inner-left curled petal */}
      <path d="M174 34 C176 29, 183 28, 187 31 C189 33, 187 36, 184 35 C181 34, 178 36, 177 39 C176 42, 173 40, 174 34 Z" />
      {/* Center-bottom inner petal */}
      <path d="M175 44 C178 47, 185 47, 188 42 C190 39, 187 37, 184 39 C182 41, 179 41, 176 41 C174 41, 173 43, 175 44 Z" />
      {/* Tiny inner heart dot */}
      <circle cx="182" cy="36.5" r="2.1" />
    </g>

    {/* ===== RIGHT TENDRILS (V-fork: upper inward curl + lower wave with tiny ripple) ===== */}
    {/* Upper-right branch rising to a delicate inward curl */}
    <path
      d="M210 38 C222 30, 236 22, 246 18 C253 15, 258 18, 256 23 C254 27, 248 28, 244 26"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Lower-right long sweeping curve rising into a small wave and final flick */}
    <path
      d="M210 38 C224 42, 244 45, 264 41 C276 38, 286 32, 294 31 C299 30, 300 35, 306 34 C313 33, 322 28, 334 32"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
