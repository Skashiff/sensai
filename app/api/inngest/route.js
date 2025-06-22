//this is the route file which communicates with the lib/inngest...
// this is the public api for the inngest
import { serve } from "inngest/next";

import { inngest } from "@/lib/inngest/client";
import { generateIndustryInsights } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateIndustryInsights],
});
