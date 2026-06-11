import React from 'react';
import { Image as ExpoImage } from 'expo-image';

export function CustomImage({ source, style, ...props }) {
  // If the source is an object with a default property that is a function (due to babel transformer)
  let SvgComponent = null;
  if (typeof source === 'function') {
    SvgComponent = source;
  } else if (source && typeof source === 'object' && typeof source.default === 'function') {
    SvgComponent = source.default;
  } else if (source && typeof source === 'object' && source.$$typeof) {
    // It's a React element/component
    SvgComponent = source;
  }

  if (SvgComponent) {
    let svgWidth = props.width || '100%';
    let svgHeight = props.height || '100%';
    
    if (style) {
      const flattenedStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
      if (flattenedStyle.width !== undefined) svgWidth = flattenedStyle.width;
      if (flattenedStyle.height !== undefined) svgHeight = flattenedStyle.height;
    }

    return (
      <SvgComponent 
        style={style} 
        width={svgWidth} 
        height={svgHeight} 
        preserveAspectRatio="xMidYMid meet"
        {...props} 
      />
    );
  }

  return <ExpoImage source={source} style={style} {...props} />;
}
