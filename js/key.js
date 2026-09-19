/* =============================================================
   key.js — the scoring key. Not shown to respondents.
   One block per case, matching the issue keys in cases.js.
   own / wait / hold: a 0-100 score for giving that issue that label.
   del: score for giving that issue to that person. A person who is not
   listed scores CONFIG.unlistedDelegateScore.
   ============================================================= */

window.KEY = {
 1:{own:{quality:100, ops:80, supplier:60, retailer:45, marketing:20},
    wait:{marketing:100, supplier:70, retailer:55, ops:25, quality:0},
    hold:{quality:100, retailer:35, supplier:20, marketing:10, ops:0},
    del:{supplier:{arjun:100}, retailer:{priya:100}, quality:{meera:100},
         marketing:{kabir:100}, ops:{meera:70, arjun:40, priya:20, kabir:10}}},

 2:{own:{ananya:100, data:95, client:90, finance:60, partner:30},
    wait:{partner:100, finance:70, client:25, ananya:20, data:0},
    hold:{ananya:100, data:95, client:50, finance:35, partner:25},
    del:{client:{riya:100}, ananya:{sara:100}, finance:{kabir:100}, data:{mehul:100},
         partner:{riya:55, kabir:30, mehul:20, sara:70}}},

 3:{own:{analysis:100, dashboard:55, hires:35, software:30, event:10},
    wait:{event:100, software:80, hires:55, dashboard:25, analysis:0},
    hold:{software:100, analysis:40, dashboard:25, hires:10, event:10},
    del:{analysis:{tara:35, imran:25, neel:15, maya:30}, dashboard:{imran:100},
         hires:{neel:100}, event:{maya:100, neel:80, tara:60, imran:50},
         software:{maya:75, tara:55, neel:45, imran:45}}},

 4:{own:{complaint:100, shifts:65, overtime:55, warning:45, meeting:25},
    wait:{meeting:100, overtime:70, shifts:40, complaint:20, warning:0},
    hold:{warning:100, complaint:90, shifts:30, overtime:10, meeting:10},
    del:{complaint:{meher:20, karan:30, ashok:55, zoya:10},
         warning:{meher:10, karan:15, ashok:20, zoya:5},
         overtime:{zoya:100}, meeting:{karan:100}, shifts:{ashok:100}}},

 5:{own:{city:100, analysis:75, waiver:50, coordinator:20, travel:15},
    wait:{coordinator:100, travel:80, analysis:65, waiver:20, city:0},
    hold:{waiver:100, city:90, analysis:25, coordinator:10, travel:10},
    del:{city:{imtiaz:55, prakash:40, sonia:35, kavita:20},
         waiver:{imtiaz:100, kavita:70, prakash:30, sonia:20},
         analysis:{prakash:100}, coordinator:{sonia:100}, travel:{kavita:100}}},

 6:{own:{form:100, customer:55, supplier:40, panel:30, report:10},
    wait:{report:100, supplier:80, panel:45, customer:25, form:0},
    hold:{supplier:100, customer:35, panel:15, report:10, form:0},
    del:{form:{harish:0, naina:0, bhavna:0, omar:0},
         customer:{harish:100, omar:50, naina:30, bhavna:20},
         panel:{naina:100, omar:100, harish:20, bhavna:10},
         supplier:{bhavna:75, omar:60, naina:45, harish:40},
         report:{bhavna:100, omar:55, naina:50, harish:50}}}
};
