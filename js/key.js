/* =============================================================
   key.js — the scoring key. Never shown to anyone.

   own / wait / hold  a 0-100 score for giving that issue that label.
   del                a score for every person on every issue. All four
                      are listed on purpose: an unlisted person falls
                      back to CONFIG.unlistedDelegateScore, and a silent
                      0 there is a 100-point cliff for a choice nothing
                      in the case rules out.

   Two rules the page now checks:
   - no issue may score 100 on both own and hold. Owning it and
     refusing to act on it cannot both be the best answer.
   - every person in the roster must appear in every issue's del block.
   ============================================================= */

window.KEY = {
 1:{own:{ops:100, quality:75, supplier:55, retailer:45, marketing:20},
    wait:{marketing:100, supplier:60, retailer:45, ops:15, quality:0},
    hold:{quality:100, ops:30, retailer:30, supplier:20, marketing:10},
    del:{supplier:{arjun:100, meera:45, priya:35, kabir:10},
         retailer:{priya:100, arjun:45, kabir:35, meera:10},
         marketing:{kabir:100, priya:45, arjun:15, meera:10},
         quality:{meera:100, arjun:40, priya:10, kabir:5},
         ops:{meera:70, arjun:60, priya:15, kabir:10}}},

 2:{own:{client:100, data:75, ananya:70, finance:45, partner:20},
    wait:{partner:100, finance:55, ananya:25, data:20, client:0},
    hold:{ananya:100, data:40, client:30, finance:20, partner:15},
    del:{client:{riya:100, varun:40, mehul:35, sara:20},
         ananya:{sara:100, riya:55, varun:15, mehul:15},
         finance:{varun:100, riya:55, mehul:40, sara:25},
         data:{mehul:100, riya:50, varun:40, sara:15},
         partner:{riya:80, mehul:60, varun:55, sara:40}}},

 3:{own:{analysis:100, dashboard:55, software:45, hires:30, event:10},
    wait:{event:100, software:70, hires:45, dashboard:25, analysis:0},
    hold:{software:100, analysis:35, dashboard:30, hires:10, event:10},
    del:{analysis:{tara:45, maya:30, imran:20, neel:10},
         dashboard:{imran:100, maya:45, tara:35, neel:10},
         hires:{neel:100, maya:55, tara:20, imran:15},
         event:{maya:100, neel:75, tara:55, imran:45},
         software:{maya:70, neel:65, imran:55, tara:40}}},

 4:{own:{complaint:100, warning:55, shifts:50, overtime:45, meeting:20},
    wait:{meeting:100, overtime:60, shifts:45, complaint:15, warning:10},
    hold:{warning:100, complaint:80, shifts:25, overtime:20, meeting:10},
    del:{complaint:{karan:55, ashok:35, meher:20, zoya:10},
         warning:{karan:20, ashok:20, meher:10, zoya:10},
         overtime:{zoya:100, ashok:60, meher:35, karan:10},
         meeting:{karan:100, meher:45, ashok:25, zoya:10},
         shifts:{ashok:100, meher:60, zoya:30, karan:10}}},

 5:{own:{drop:100, diagnosis:65, sponsor:55, coordinator:20, travel:10},
    wait:{coordinator:100, travel:75, diagnosis:45, sponsor:25, drop:0},
    hold:{sponsor:100, drop:70, diagnosis:20, coordinator:15, travel:10},
    del:{drop:{imtiaz:45, prakash:45, sonia:35, kavita:25},
         sponsor:{imtiaz:100, kavita:60, prakash:25, sonia:20},
         diagnosis:{prakash:100, kavita:40, sonia:30, imtiaz:25},
         coordinator:{sonia:100, prakash:40, imtiaz:35, kavita:30},
         travel:{kavita:100, sonia:65, imtiaz:30, prakash:25}}},

 6:{own:{form:100, customer:55, supplier:45, panel:25, report:10},
    wait:{report:100, supplier:70, panel:40, customer:25, form:0},
    hold:{supplier:100, customer:30, panel:15, report:10, form:0},
    del:{form:{omar:0, bhavna:0, harish:0, naina:0},
         customer:{harish:100, omar:55, naina:20, bhavna:20},
         panel:{naina:100, omar:70, harish:35, bhavna:30},
         supplier:{bhavna:85, omar:60, harish:35, naina:20},
         report:{bhavna:100, omar:50, naina:40, harish:40}}}
};
