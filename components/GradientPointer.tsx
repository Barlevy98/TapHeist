import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Line } from 'react-native-svg';

interface GradientPointerProps {
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  rotation?: number; // הזווית שבה המחוג נמצא כרגע
}

export const GradientPointer: React.FC<GradientPointerProps> = ({
  size = 250,
  primaryColor = '#FFFF00', // צבע 1 (למשל: צהוב)
  secondaryColor = '#0000FF', // צבע 2 (למשל: כחול)
  rotation = 0,
}) => {
  const center = size / 2;

  return (
    // סיבוב ה-SVG כולו בהתאם לזווית של המשחק
    <Svg 
      width={size} 
      height={size} 
      style={{ transform: [{ rotate: `${rotation}deg` }], position: 'absolute' }}
    >
      <Defs>
        <LinearGradient id="pointerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={primaryColor} stopOpacity="1" />
          <Stop offset="100%" stopColor={secondaryColor} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      
      {/* המחוג עצמו (Line) שיוצא מהאמצע כלפי מעלה */}
      <Line
        x1={center}
        y1={center}
        x2={center}
        y2={15} // קצה המחוג (כמה קרוב הוא מגיע לקצה הכספת)
        stroke="url(#pointerGradient)"
        strokeWidth={6}
        strokeLinecap="round"
      />
    </Svg>
  );
};