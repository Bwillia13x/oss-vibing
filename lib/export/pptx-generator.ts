/**
 * PPTX Export Generator for Vibe University
 * 
 * Generates PowerPoint presentations from deck content
 * Supports multiple slide layouts, charts, and speaker notes
 */

import pptxgen from 'pptxgenjs';

export interface PPTXExportOptions {
  title?: string;
  author?: string;
  subject?: string;
  
  // Presentation settings
  layout?: 'LAYOUT_16x9' | 'LAYOUT_4x3' | 'LAYOUT_WIDE';
  
  // Theme
  theme?: {
    background?: string;
    text?: string;
    accent?: string;
  };
  
  // Content
  includeTitleSlide?: boolean;
  includeSpeakerNotes?: boolean;
}

export interface PPTXSlide {
  type: 'title' | 'content' | 'section' | 'two-column' | 'blank' | 'title-only';
  title?: string;
  subtitle?: string;
  content?: string[];
  leftContent?: string[];
  rightContent?: string[];
  speakerNotes?: string;
  image?: {
    path: string;
    x?: number;
    y?: number;
    w?: number;
    h?: number;
  };
  chart?: {
    type: 'bar' | 'line' | 'pie' | 'scatter';
    data: any;
    options?: any;
  };
}

const DEFAULT_OPTIONS: Required<PPTXExportOptions> = {
  title: 'Presentation',
  author: '',
  subject: '',
  layout: 'LAYOUT_16x9',
  theme: {
    background: 'FFFFFF',
    text: '000000',
    accent: '4472C4',
  },
  includeTitleSlide: true,
  includeSpeakerNotes: true,
};

/**
 * Generate PPTX from slide data
 */
export async function generatePPTX(
  slides: PPTXSlide[],
  options: PPTXExportOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Create presentation
  const pres = new pptxgen();
  
  // Set properties
  pres.author = opts.author;
  pres.title = opts.title;
  pres.subject = opts.subject;
  pres.layout = opts.layout;
  
  // Define master slide theme
  pres.defineSlideMaster({
    title: 'MASTER_SLIDE',
    background: { color: opts.theme.background },
    objects: [
      {
        rect: {
          x: 0,
          y: 0,
          w: '100%',
          h: 0.5,
          fill: { color: opts.theme.accent },
        },
      },
    ],
  });
  
  // Add title slide
  if (opts.includeTitleSlide) {
    addTitleSlide(pres, opts);
  }
  
  // Add content slides
  for (const slideData of slides) {
    addSlide(pres, slideData, opts);
  }
  
  // Generate blob
  const buffer = await pres.write({ outputType: 'blob' });
  return buffer as Blob;
}

/**
 * Add title slide
 */
function addTitleSlide(pres: pptxgen, options: Required<PPTXExportOptions>): void {
  const slide = pres.addSlide({ masterName: 'MASTER_SLIDE' });
  
  slide.addText(options.title, {
    x: 1,
    y: 2.5,
    w: 8,
    h: 1,
    fontSize: 44,
    bold: true,
    color: options.theme.text,
    align: 'center',
  });
  
  if (options.author) {
    slide.addText(options.author, {
      x: 1,
      y: 4,
      w: 8,
      h: 0.5,
      fontSize: 20,
      color: options.theme.text,
      align: 'center',
    });
  }
  
  slide.addText(new Date().toLocaleDateString(), {
    x: 1,
    y: 4.8,
    w: 8,
    h: 0.3,
    fontSize: 14,
    color: options.theme.text,
    align: 'center',
  });
}

/**
 * Add slide based on type
 */
function addSlide(
  pres: pptxgen,
  slideData: PPTXSlide,
  options: Required<PPTXExportOptions>
): void {
  const slide = pres.addSlide({ masterName: 'MASTER_SLIDE' });
  
  switch (slideData.type) {
    case 'title':
      addTitleSlideContent(slide, slideData, options);
      break;
    case 'content':
      addContentSlide(slide, slideData, options);
      break;
    case 'section':
      addSectionSlide(slide, slideData, options);
      break;
    case 'two-column':
      addTwoColumnSlide(slide, slideData, options);
      break;
    case 'title-only':
      addTitleOnlySlide(slide, slideData, options);
      break;
    case 'blank':
      // Blank slide - no content
      break;
  }
  
  // Add speaker notes if enabled
  if (options.includeSpeakerNotes && slideData.speakerNotes) {
    slide.addNotes(slideData.speakerNotes);
  }
}

/**
 * Add title slide content
 */
function addTitleSlideContent(
  slide: any,
  slideData: PPTXSlide,
  options: Required<PPTXExportOptions>
): void {
  if (slideData.title) {
    slide.addText(slideData.title, {
      x: 1,
      y: 2.5,
      w: 8,
      h: 1,
      fontSize: 44,
      bold: true,
      color: options.theme.text,
      align: 'center',
    });
  }
  
  if (slideData.subtitle) {
    slide.addText(slideData.subtitle, {
      x: 1,
      y: 4,
      w: 8,
      h: 0.5,
      fontSize: 24,
      color: options.theme.text,
      align: 'center',
    });
  }
}

/**
 * Add content slide
 */
function addContentSlide(
  slide: any,
  slideData: PPTXSlide,
  options: Required<PPTXExportOptions>
): void {
  // Title
  if (slideData.title) {
    slide.addText(slideData.title, {
      x: 0.5,
      y: 0.7,
      w: 9,
      h: 0.6,
      fontSize: 32,
      bold: true,
      color: options.theme.text,
    });
  }
  
  // Content bullets
  if (slideData.content && slideData.content.length > 0) {
    const bulletPoints = slideData.content.map((item) => ({
      text: item,
      options: { bullet: true, fontSize: 18, color: options.theme.text },
    }));
    
    slide.addText(bulletPoints, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 4,
    });
  }
  
  // Image
  if (slideData.image) {
    slide.addImage({
      path: slideData.image.path,
      x: slideData.image.x || 6,
      y: slideData.image.y || 2,
      w: slideData.image.w || 3,
      h: slideData.image.h || 3,
    });
  }
  
  // Chart
  if (slideData.chart) {
    addChart(slide, slideData.chart);
  }
}

/**
 * Add section header slide
 */
function addSectionSlide(
  slide: any,
  slideData: PPTXSlide,
  options: Required<PPTXExportOptions>
): void {
  // Background accent
  slide.background = { color: options.theme.accent };
  
  if (slideData.title) {
    slide.addText(slideData.title, {
      x: 1,
      y: 2.5,
      w: 8,
      h: 1,
      fontSize: 44,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
    });
  }
}

/**
 * Add two-column slide
 */
function addTwoColumnSlide(
  slide: any,
  slideData: PPTXSlide,
  options: Required<PPTXExportOptions>
): void {
  // Title
  if (slideData.title) {
    slide.addText(slideData.title, {
      x: 0.5,
      y: 0.7,
      w: 9,
      h: 0.6,
      fontSize: 32,
      bold: true,
      color: options.theme.text,
    });
  }
  
  // Left column
  if (slideData.leftContent && slideData.leftContent.length > 0) {
    const leftBullets = slideData.leftContent.map((item) => ({
      text: item,
      options: { bullet: true, fontSize: 16, color: options.theme.text },
    }));
    
    slide.addText(leftBullets, {
      x: 0.5,
      y: 1.5,
      w: 4.25,
      h: 4,
    });
  }
  
  // Right column
  if (slideData.rightContent && slideData.rightContent.length > 0) {
    const rightBullets = slideData.rightContent.map((item) => ({
      text: item,
      options: { bullet: true, fontSize: 16, color: options.theme.text },
    }));
    
    slide.addText(rightBullets, {
      x: 5.25,
      y: 1.5,
      w: 4.25,
      h: 4,
    });
  }
}

/**
 * Add title-only slide
 */
function addTitleOnlySlide(
  slide: any,
  slideData: PPTXSlide,
  options: Required<PPTXExportOptions>
): void {
  if (slideData.title) {
    slide.addText(slideData.title, {
      x: 0.5,
      y: 0.7,
      w: 9,
      h: 0.6,
      fontSize: 32,
      bold: true,
      color: options.theme.text,
    });
  }
}

/**
 * Add chart to slide
 */
function addChart(slide: any, chartData: PPTXSlide['chart']): void {
  if (!chartData) return;
  
  const chartOptions = {
    x: 1,
    y: 1.5,
    w: 8,
    h: 4,
    ...chartData.options,
  };
  
  switch (chartData.type) {
    case 'bar':
      slide.addChart(pptxgen.ChartType.bar, chartData.data, chartOptions);
      break;
    case 'line':
      slide.addChart(pptxgen.ChartType.line, chartData.data, chartOptions);
      break;
    case 'pie':
      slide.addChart(pptxgen.ChartType.pie, chartData.data, chartOptions);
      break;
    case 'scatter':
      slide.addChart(pptxgen.ChartType.scatter, chartData.data, chartOptions);
      break;
  }
}

/**
 * Parse markdown to PPTX slides
 * Splits content by ## headers to create slides
 */
export function parseMarkdownToSlides(markdown: string): PPTXSlide[] {
  const slides: PPTXSlide[] = [];
  const lines = markdown.split('\n');
  
  let currentSlide: PPTXSlide | null = null;
  let currentContent: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // New slide on ## header
    if (trimmed.startsWith('## ')) {
      // Save previous slide
      if (currentSlide) {
        currentSlide.content = currentContent;
        slides.push(currentSlide);
      }
      
      // Start new slide
      currentSlide = {
        type: 'content',
        title: trimmed.replace(/^##\s+/, ''),
      };
      currentContent = [];
      continue;
    }
    
    // Skip empty lines and # headers (main title)
    if (!trimmed || trimmed.startsWith('# ')) {
      continue;
    }
    
    // Add bullet points
    if (trimmed.match(/^[-*]\s+/)) {
      currentContent.push(trimmed.replace(/^[-*]\s+/, ''));
      continue;
    }
    
    // Add paragraph as bullet point
    if (currentSlide && trimmed) {
      currentContent.push(trimmed);
    }
  }
  
  // Add final slide
  if (currentSlide) {
    currentSlide.content = currentContent;
    slides.push(currentSlide);
  }
  
  return slides;
}

/**
 * Export to PPTX and trigger download
 */
export async function exportToPPTX(
  slides: PPTXSlide[],
  filename: string,
  options: PPTXExportOptions = {}
): Promise<void> {
  const blob = await generatePPTX(slides, options);
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.pptx') ? filename : `${filename}.pptx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
