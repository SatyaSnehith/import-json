// Show the plugin UI
figma.showUI(__html__, { width: 300, height: 200 });

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'import-json') {
    const jsonData = JSON.parse(msg.json);
    const parentNode = await createNodeFromJson(jsonData);
    if (parentNode) {
      figma.currentPage.appendChild(parentNode);
      figma.closePlugin();
    }
  }
};

// Function to create a Figma node from JSON data
async function createNodeFromJson(data: NodeData) {
  let node;
  if (data.type === 'FRAME') {
    node = figma.createFrame();
    node.primaryAxisSizingMode = 'AUTO';
    node.counterAxisSizingMode = 'AUTO';
    const autoLayout = data.autoLayout
    if (autoLayout) {
      node.layoutMode = autoLayout.direction;
      node.itemSpacing = autoLayout.spacing;
      node.paddingTop = autoLayout.padding.top;
      node.paddingRight = autoLayout.padding.right;
      node.paddingBottom = autoLayout.padding.bottom;
      node.paddingLeft = autoLayout.padding.left;
    }
  } else if (data.type === 'RECTANGLE') {
    node = figma.createRectangle();
    if (data.iconUrl) {
      // const image = await fetchImage(data.iconUrl);
      const figmaImage  = await figma.createImageAsync(data.iconUrl);
      const paint: ImagePaint = {
        type: "IMAGE",
        scaleMode: "FILL",
        imageHash: figmaImage.hash,
      };
      node.fills = [paint];
    }  else if (data.styles?.fill) {
      const fillColor = data.styles.fill;
      const paint: SolidPaint = {
        type: "SOLID",
        color: {
          r: fillColor.r,
          g: fillColor.g,
          b: fillColor.b,
        },
      };
      node.fills = [paint];
    } else {
      console.warn(`No valid fill color or icon URL provided for node: ${data.name}`);
    }
  }
  if (node) {
    node.resize(data.width, data.height);
    node.x = data.x;
    node.y = data.y;
    node.name = data.name;
    for (const child of data.children) {
      const childNode = await createNodeFromJson(child);
      if (childNode) {
        if ("appendChild" in node) {
          node.appendChild(childNode);
        } else {
          console.warn(`Node type ${node.type} does not support appendChild`);
        }
      }
    }
  }
  return node;
}

// Function to fetch an image from a URL
async function fetchImage(url: string) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headersObject

  console.log(contentType)
  console.log(arrayBuffer)
  console.log(new Uint8Array(arrayBuffer))
  return new Uint8Array(arrayBuffer);
}

interface NodeData {
  type: string; // 'FRAME' | 'RECTANGLE' | 'TEXT' | 'GROUP'; // Add other Figma node types as needed
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  autoLayout?: {
    direction: "NONE" | "HORIZONTAL" | "VERTICAL";
    spacing: number;
    padding: { top: number; right: number; bottom: number; left: number };
  };
  styles?: {
    fill?: { r: number; g: number; b: number };
    stroke?: { r: number; g: number; b: number };
    fontSize?: number;
    fontFamily?: string;
  };
  iconUrl?: string; // For image URLs
  children: NodeData[]; // Recursive type for child nodes
}
