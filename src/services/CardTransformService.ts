import type { CardData, CardView, CardInput } from '@/types/card'

const VALID_LAYOUTS = ['default', 'two-row', 'two-column'] as const
type ValidLayout = typeof VALID_LAYOUTS[number]

function validateLayout(layout: string): ValidLayout {
  if (!VALID_LAYOUTS.includes(layout as ValidLayout)) {
    console.warn(`Invalid layout: ${layout}, defaulting to 'default'`)
    return 'default'
  }
  return layout as ValidLayout
}

export class CardTransformService {
  /**
   * Transforms database card data into view model
   */
  static toView(data: CardData): CardView {
    // Handle both string and object formats for front/back
    const frontText = typeof data.front === 'string' ? data.front : data.front.text;
    const frontImage = typeof data.front === 'string' ? null : data.front.imageUrl;
    const backText = typeof data.back === 'string' ? data.back : data.back.text;
    const backImage = typeof data.back === 'string' ? null : data.back.imageUrl;

    return {
      id: data.id,
      setId: data.setId,
      front: {
        text: frontText,
        imageUrl: frontImage,
        layout: validateLayout(data.layout_front)
      },
      back: {
        text: backText,
        imageUrl: backImage,
        layout: validateLayout(data.layout_back)
      },
      hint: data.hint
    }
  }

  /**
   * Transforms view model back to database format
   */
  static toData(view: CardView): CardData {
    return {
      id: view.id,
      setId: view.setId,
      front: view.front.text,
      back: view.back.text,
      frontImage: view.front.imageUrl,
      backImage: view.back.imageUrl,
      hint: view.hint,
      layout_front: view.front.layout,
      layout_back: view.back.layout
    }
  }

  /**
   * Transforms view model to input format
   */
  static toInput(view: CardView): CardInput {
    return {
      front: view.front.text,
      back: view.back.text,
      frontImage: view.front.imageUrl,
      backImage: view.back.imageUrl,
      hint: view.hint,
      layout_front: validateLayout(view.front.layout),
      layout_back: validateLayout(view.back.layout)
    }
  }
}