"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { plainAr } from "@/lib/arabic-text";

type Lang = "ar" | "en";

const translations: Record<string, Record<Lang, string>> = {
  // Navbar
  "nav.search": { ar: "ابحث في نورث فول...", en: "Search NorthFall..." },
  "nav.notifs": { ar: "الإشعارات", en: "Notifications" },
  "nav.noNotifs": { ar: "لا توجد إشعارات", en: "No notifications" },
  "nav.settings": { ar: "الإعدادات", en: "Settings" },
  "nav.login": { ar: "تسجيل الدخول", en: "Log In" },
  "nav.profile": { ar: "البروفايل", en: "Profile" },
  // SidebarLeft
  "sb.browse": { ar: "التصفح", en: "Browse" },
  "sb.home": { ar: "الرئيسية", en: "Home" },
  "sb.popular": { ar: "الرائج", en: "Popular" },
  "sb.explore": { ar: "استكشف", en: "Explore" },
  "sb.personal": { ar: "شخصي", en: "Personal" },
  "sb.profile": { ar: "البروفايل", en: "Profile" },
  "sb.saved": { ar: "المحفوظات", en: "Saved" },
  "sb.notifs": { ar: "الإشعارات", en: "Notifications" },
  "sb.communities": { ar: "المجتمعات", en: "Communities" },
  "sb.searchComm": { ar: "ابحث عن مجتمع...", en: "Search communities..." },
  "sb.settings": { ar: "الإعدادات", en: "Settings" },
  "sb.help": { ar: "المساعدة", en: "Help" },
  "sb.rules": { ar: "القواعد", en: "Rules" },
  // SidebarRight
  "sr.newPosts": { ar: "إيش الجديد؟", en: "What's New?" },
  "sr.noPosts": { ar: "لا توجد منشورات بعد", en: "No posts yet" },
  "sr.about": { ar: "عن المجتمع", en: "About Community" },
  "sr.founded": { ar: "تأسس 2026", en: "Founded 2026" },
  "sr.members": { ar: "عضو", en: "members" },
  "sr.rules": { ar: "قوانين المجتمع", en: "Community Rules" },
  "sr.mods": { ar: "المشرفون", en: "Moderators" },
  "sr.creator": { ar: "صانع المجتمع", en: "Community Creator" },
  "sr.stats": { ar: "إحصائيات", en: "Stats" },
  "sr.tags": { ar: "الوسوم", en: "Tags" },
  "sr.trending": { ar: "مجتمعات رهيبة", en: "Trending Communities" },
  "sr.displayComms": { ar: "مجتمعات مقترحة", en: "Suggested communities" },
  "sr.join": { ar: "انضمام", en: "Join" },
  "sr.privacy": { ar: "سياسة الخصوصية", en: "Privacy Policy" },
  "sr.terms": { ar: "اتفاقية الاستخدام", en: "Terms of Use" },
  "sr.help": { ar: "المساعدة", en: "Help" },
  "sr.trendingCommunities": { ar: "مجتمعات رائجة", en: "Trending Communities" },
  "sr.siteRules": { ar: "قوانين الموقع", en: "Site Rules" },
  "sr.rule1": { ar: "احترام الجميع، لا للتحرش أو التنمر", en: "Respect everyone, no harassment or bullying" },
  "sr.rule2": { ar: "لا سبام أو إعلانات غير مصرح بها", en: "No spam or unauthorized ads" },
  "sr.rule3": { ar: "المحتوى يجب أن يكون مناسب ومناسب للمجتمع", en: "Content must be appropriate and relevant" },
  "sr.rule4": { ar: "لا تكرر المنشورات أو المحتوى", en: "No reposting or duplicate content" },
  // FeedSort
  "fs.online": { ar: "متصل الآن", en: "online now" },
  "fs.hot": { ar: "رائج", en: "Hot" },
  "fs.new": { ar: "جديد", en: "New" },
  "fs.top": { ar: "الأفضل", en: "Top" },
  "fs.trending": { ar: "هاشتاقات", en: "Hashtags" },
  "fs.topNow": { ar: "الأكثر رواجاً الآن", en: "Trending now" },
  // PostCard
  "pc.vote": { ar: "أبفوت", en: "upvote" },
  "pc.comments": { ar: "تعليق", en: "comment" },
  "pc.share": { ar: "مشاركة", en: "Share" },
  "pc.embed": { ar: "تضمين", en: "Embed" },
  "pc.copied": { ar: "تم النسخ!", en: "Copied!" },
  "pc.readTime": { ar: "دقيقة قراءة", en: "min read" },
  // PostDetail
  "pd.back": { ar: "العودة", en: "Back" },
  "pd.save": { ar: "حفظ", en: "Save" },
  "pd.saved": { ar: "محفوظ", en: "Saved" },
  "pd.share": { ar: "مشاركة", en: "Share" },
  "pd.views": { ar: "مشاهدة", en: "views" },
  "pd.readTime": { ar: "دقيقة قراءة", en: "min read" },
  "pd.sortBest": { ar: "الأفضل", en: "Best" },
  "pd.sortRecommended": { ar: "مُختار", en: "Recommended" },
  "pd.sortVotes": { ar: "الأكثر دعمًا", en: "Most upvoted" },
  "pd.sortThreads": { ar: "أغزر نقاشًا", en: "Most replies" },
  "pd.filterAll": { ar: "الكل", en: "All" },
  "pd.filterAuthor": { ar: "كاتب", en: "Author" },
  "pd.filterLinks": { ar: "فيه رابط", en: "Has link" },
  "pd.filterLong": { ar: "طويل", en: "Long" },
  "pd.sortNew": { ar: "جديد", en: "New" },
  "pd.searchComments": { ar: "ابحث في التعليقات...", en: "Search comments..." },
  "pd.writeComment": { ar: "اكتب تعليقاً...", en: "Write a comment..." },
  "pd.submit": { ar: "إرسال", en: "Submit" },
  "pd.reply": { ar: "رد", en: "Reply" },
  "pd.shortcuts": { ar: "اختصارات", en: "Shortcuts" },
  "pd.escBack": { ar: "العودة", en: "Go Back" },
  "pd.sSave": { ar: "حفظ المنشور", en: "Save Post" },
  "pd.noComments": { ar: "لا توجد تعليقات بعد", en: "No comments yet" },
  "pd.beFirst": { ar: "كن أول من يعلق!", en: "Be the first to comment!" },
  // General
  "gen.loading": { ar: "جاري التحميل...", en: "Loading..." },
  "gen.noPosts": { ar: "لا توجد منشورات بعد", en: "No posts yet" },
  "gen.createFirst": { ar: "شارك أول منشور لك ليظهر هنا", en: "Share your first post to see it here" },
  "gen.welcome": { ar: "مرحباً بك في NorthFall!", en: "Welcome to NorthFall!" },
  "gen.welcomeSub": { ar: "منصة المجتمعات العربية — شارك أفكارك، انضم للمجتمعات، وتواصل مع الآخرين", en: "The open community platform — share ideas, join communities, and connect with others" },
  "gen.createPost": { ar: "أنشئ منشوراً...", en: "Create a post..." },
  "gen.saved": { ar: "تم الحفظ ✓", en: "Saved ✓" },
  "gen.saveChanges": { ar: "حفظ التغييرات", en: "Save Changes" },
  "gen.logOut": { ar: "تسجيل الخروج", en: "Log Out" },
  "gen.user": { ar: "مستخدم", en: "User" },
  "gen.general": { ar: "عام", en: "general" },
  "gen.all": { ar: "الكل", en: "All" },
  "gen.following": { ar: "المتابَعين", en: "Following" },
  "gen.follow": { ar: "متابعة", en: "Follow" },
  "gen.followingStatus": { ar: "متابَع", en: "Following" },
  "gen.followers": { ar: "يتابعونه", en: "followers" },
  "gen.followingCount": { ar: "يتابعهم", en: "following" },
  "gen.noFollowingPosts": { ar: "لا يوجد منشورات من المتابَعين", en: "No posts from followed users" },
  "gen.followHint": { ar: "تابع مستخدمين أو انضم لمجتمعات لتظهر منشوراتهم هنا", en: "Follow users or join communities to see their posts here" },
  "gen.viewAll": { ar: "عرض الكل", en: "View All" },
  "gen.myCommunities": { ar: "مجتمعاتي", en: "My Communities" },
  "gen.loginToJoin": { ar: "سجّل للانضمام", en: "Log in to join" },
  "gen.now": { ar: "الآن", en: "now" },
  "gen.minuteAgo": { ar: "منذ {n} دقيقة", en: "{n}m ago" },
  "gen.hourAgo": { ar: "منذ {n} ساعة", en: "{n}h ago" },
  "gen.dayAgo": { ar: "منذ {n} يوم", en: "{n}d ago" },
  "gen.monthAgo": { ar: "منذ {n} شهر", en: "{n}mo ago" },
  // PostDetail extra
  "pd.savePost": { ar: "تم حفظ المنشور", en: "Post saved" },
  "pd.unsavePost": { ar: "تم إزالة الحفظ", en: "Post unsaved" },
  "pd.copyText": { ar: "تم نسخ النص", en: "Text copied" },
  "pd.copyLink": { ar: "تم نسخ الرابط", en: "Link copied" },
  "pd.copyCommentLink": { ar: "تم نسخ رابط التعليق", en: "Comment link copied" },
  "pd.copyContent": { ar: "تم نسخ المحتوى والرابط", en: "Content & link copied" },
  "pd.openWhatsapp": { ar: "فتح واتساب", en: "Opened WhatsApp" },
  "pd.openTelegram": { ar: "فتح تيليجرام", en: "Opened Telegram" },
  "pd.openTwitter": { ar: "فتح تويتر", en: "Opened Twitter" },
  "pd.whatsapp": { ar: "واتساب", en: "WhatsApp" },
  "pd.telegram": { ar: "تيليجرام", en: "Telegram" },
  "pd.twitter": { ar: "تويتر / X", en: "Twitter / X" },
  "pd.copyContentLink": { ar: "نسخ المحتوى + الرابط", en: "Copy content + link" },
  "pd.copyLinkOnly": { ar: "نسخ الرابط فقط", en: "Copy link only" },
  "pd.report": { ar: "إبلاغ", en: "Report" },
  "pd.delete": { ar: "حذف", en: "Delete" },
  "pd.copy": { ar: "نسخ", en: "Copy" },
  "pd.link": { ar: "رابط", en: "Link" },
  "pd.readMore": { ar: "اقرأ المزيد:", en: "Read more:" },
  // ProfilePage
  "pp.posts": { ar: "المنشورات", en: "Posts" },
  "pp.comments": { ar: "التعليقات", en: "Comments" },
  "pp.saved": { ar: "المحفوظات", en: "Saved" },
  "pp.awards": { ar: "الجوائز", en: "Awards" },
  "pp.karma": { ar: "صيت", en: "reputation" },
  "pp.postCount": { ar: "منشور", en: "posts" },
  "pp.joinedRecently": { ar: "انضم حديثاً", en: "Joined recently" },
  "pp.noComments": { ar: "لا توجد تعليقات بعد", en: "No comments yet" },
  "pp.commentOn": { ar: "تعليق على:", en: "Comment on:" },
  "pp.noSaved": { ar: "لا توجد محفوظات بعد", en: "No saved posts yet" },
  "pp.saveHint": { ar: "احفظ المنشورات لتظهر هنا", en: "Save posts to see them here" },
  "pp.loginPrompt": { ar: "سجّل دخولك لمشاهدة ملفك الشخصي", en: "Log in to view your profile" },
  "pp.edit": { ar: "تعديل", en: "Edit" },
  "pp.upvote": { ar: "أبفوت", en: "upvote" },
  // SidebarRight extra
  "sr.members2": { ar: "عضو", en: "members" },
  "sr.upvote": { ar: "أبفوت", en: "upvote" },
  "sr.comment": { ar: "تعليق", en: "comment" },
  "sr.communityCreator": { ar: "صانع المجتمع", en: "Community Creator" },
  "sr.aboutCommunity": { ar: "عن المجتمع", en: "About Community" },
  "sr.foundedIn": { ar: "تأسس 2026", en: "Founded 2026" },
  "sr.communityLabel": { ar: "مجتمع", en: "Community" },
  // PostCard extra
  "pc.report": { ar: "تبليغ", en: "Report" },
  "pc.save": { ar: "حفظ", en: "Save" },
  "pc.saved": { ar: "محفوظ", en: "Saved" },
  // PostDetail extra (comments section)
  "pd.commentBtn": { ar: "تعليق", en: "Comment" },
  "pd.replyTo": { ar: "رد على", en: "Reply to" },
  "pd.loginToComment": { ar: "سجّل دخولك للتعليق", en: "Log in to comment" },
  "pd.sortBy": { ar: "ترتيب حسب:", en: "Sort by:" },
  "pd.expandAll": { ar: "توسيع الكل", en: "Expand All" },
  "pd.collapseAll": { ar: "طي الكل", en: "Collapse All" },
  "pd.noCommentsYet": { ar: "لا توجد تعليقات بعد — كن أول من يعلّق!", en: "No comments yet — be the first to comment!" },
  "pd.writeReply": { ar: "اكتب ردك على", en: "Write your reply to" },
  "pd.ctrlEnter": { ar: "Ctrl+Enter للإرسال", en: "Ctrl+Enter to submit" },
  // CreatePostPage
  "cp.backToFeed": { ar: "العودة للفيد", en: "Back to Feed" },
  "cp.createPost": { ar: "إنشاء منشور", en: "Create Post" },
  "cp.drafts": { ar: "المسودات", en: "Drafts" },
  "cp.title": { ar: "العنوان*", en: "Title*" },
  "cp.addFlair": { ar: "إضافة تصنيف (Flair)*", en: "Add Flair*" },
  "cp.imagePlaceholder": { ar: "رابط الصورة (اختياري) - الصق رابط الصورة هنا", en: "Image URL (optional) - Paste image link here" },
  "cp.bodyPlaceholder": { ar: "نص المنشور — أضف #هاشتاغ مثل #gaming أو #سيارات", en: "Post text — add #hashtags like #gaming" },
  "cp.saveDraft": { ar: "حفظ المسودة", en: "Save Draft" },
  "cp.publishing": { ar: "جاري النشر...", en: "Publishing..." },
  "cp.publish": { ar: "نشر", en: "Publish" },
  "cp.generalCommunity": { ar: "المجتمع العام", en: "General Community" },
  // CommunityPage
  "cp.member": { ar: "عضو", en: "Member" },
  "cp.join": { ar: "انضمام", en: "Join" },
  "cp.members": { ar: "عضو", en: "members" },
  "cp.posts": { ar: "منشور", en: "posts" },
  "cp.comments": { ar: "تعليق", en: "comments" },
  "cp.aboutCommunity": { ar: "عن المجتمع", en: "About Community" },
  "cp.founded": { ar: "تأسس 2026", en: "Founded 2026" },
  "cp.communityRules": { ar: "قوانين المجتمع", en: "Community Rules" },
  "cp.noPosts": { ar: "لا توجد منشورات في هذا المجتمع بعد", en: "No posts in this community yet" },
  // ProfilePage extra
  "pp.noPostsYet": { ar: "لا توجد منشورات بعد", en: "No posts yet" },
  "pp.shareFirst": { ar: "شارك أول منشور لك ليظهر هنا", en: "Share your first post to see it here" },
  "pp.noCommentsYet": { ar: "لا توجد تعليقات بعد", en: "No comments yet" },
  "pp.commentToAppear": { ar: "علّق على المنشورات لتظهر هنا", en: "Comment on posts to see them here" },
  "pp.noSavedYet": { ar: "لا توجد محفوظات بعد", en: "No saved posts yet" },
  "pp.saveToAppear": { ar: "احفظ المنشورات لتظهر هنا", en: "Save posts to see them here" },
  "pp.earnedAwards": { ar: "الجوائز المحققة", en: "Earned Awards" },
  "pp.availableAwards": { ar: "الجوائز المتاحة", en: "Available Awards" },
  // HoverCard
  "hc.loading": { ar: "جاري التحميل...", en: "Loading..." },
  "hc.joinedApril": { ar: "انضم أبريل 2026", en: "Joined April 2026" },
  "hc.viewProfile": { ar: "عرض الملف", en: "View Profile" },
  "hc.viewCommunity": { ar: "عرض المجتمع", en: "View Community" },
  "hc.openToAll": { ar: "مفتوح للجميع", en: "Open to all" },
  "hc.postsDaily": { ar: "منشورات يومياً", en: "posts daily" },
  "hc.rule": { ar: "قانون", en: "rule" },
  "hc.mod": { ar: "مشرف", en: "mod" },
  // SidebarRight trending
  "sr.trendingMembers": { ar: "عضو", en: "members" },
  // timeAgo
  "gen.nowShort": { ar: "الآن", en: "now" },
  "gen.minuteShort": { ar: "د", en: "m" },
  "gen.hourShort": { ar: "س", en: "h" },
  "gen.dayShort": { ar: "ي", en: "d" },
  // Flairs
  "fl.discussion": { ar: "مناقشة", en: "Discussion" },
  "fl.help": { ar: "مساعدة", en: "Help" },
  "fl.creative": { ar: "إبداع", en: "Creative" },
  "fl.news": { ar: "خبر", en: "News" },
  "fl.learn": { ar: "تعلم", en: "Learn" },
  "fl.project": { ar: "مشروع", en: "Project" },
  "fl.question": { ar: "سؤال", en: "Question" },
  // Search
  "search.placeholder": { ar: "ابحث في المنشورات والمجتمعات والمستخدمين...", en: "Search posts, communities, and users..." },
  "search.posts": { ar: "المنشورات", en: "Posts" },
  "search.communities": { ar: "المجتمعات", en: "Communities" },
  "search.users": { ar: "المستخدمين", en: "Users" },
  "search.noResults": { ar: "لا توجد نتائج", en: "No results found" },
  "search.tryDifferent": { ar: "جرب كلمات بحث مختلفة", en: "Try different search terms" },
  "search.filterAll": { ar: "الكل", en: "All" },
  "search.sortRelevance": { ar: "أهمية", en: "Relevance" },
  "search.sortNewest": { ar: "الأحدث", en: "Newest" },
  "search.sortTop": { ar: "الأعلى", en: "Top" },
  "search.following": { ar: "المتابَعين", en: "Following" },
  "search.recent": { ar: "أحدث البحوث", en: "Recent Searches" },
  "search.clearHistory": { ar: "مسح السجل", en: "Clear History" },
  "search.trending": { ar: "الأكثر رواجاً", en: "Trending" },
  "search.open": { ar: "فتح", en: "Open" },
  "search.navigate": { ar: "تنقل", en: "Navigate" },
  "search.close": { ar: "إغلاق", en: "Close" },
  "search.results": { ar: "نتيجة", en: "results" },
  "search.sortBy": { ar: "ترتيب", en: "Sort by" },
  // HoverCard
  "hc.defaultBio": { ar: "مطور ألعاب. أحب أشارك مشاريعي وتعلم من المجتمع.", en: "Game developer. Love sharing projects and learning from the community." },
  "hc.memberOf": { ar: "عضو في n/عام", en: "Member of n/عام" },
  "hc.defaultBadges": { ar: "مطور ألعاب · نشيط · عضو جديد", en: "Game Dev · Active · New Member" },
  // PostComposer
  "pc.createPlaceholder": { ar: "أنشئ منشوراً...", en: "Create a post..." },
  "pc.addImage": { ar: "صورة", en: "Image" },
  "pc.addLink": { ar: "رابط", en: "Link" },
  "pc.addPoll": { ar: "استطلاع", en: "Poll" },
  "pc.addVoice": { ar: "صوت", en: "Voice" },
  // Nav notifs
  "nav.newNotif": { ar: "إشعار جديد", en: "New notification" },
  // PostCard
  "pc.quickReply": { ar: "اكتب رداً سريعاً...", en: "Write a quick reply..." },
  "cp.onlineNow": { ar: "متصل الآن", en: "online now" },
  "gen.newPosts": { ar: "منشورات جديدة", en: "new posts" },
  // Chat
  "chat.createGroup": { ar: "إنشاء مجموعة", en: "Create Group" },
  "chat.textChannels": { ar: "قنوات نصية", en: "Text Channels" },
  "chat.voiceChannels": { ar: "قنوات صوتية", en: "Voice Channels" },
  "chat.members": { ar: "الأعضاء", en: "Members" },
  "chat.inviteDev": { ar: "دعوة مطور", en: "Invite Developer" },
  "chat.owner": { ar: "مالك", en: "Owner" },
  "chat.channelDesc": { ar: "ابدأ المحادثة هنا", en: "Start the conversation here" },
  "chat.search": { ar: "بحث", en: "Search" },
  "chat.welcome": { ar: "مرحباً بك!", en: "Welcome!" },
  "chat.welcomeDesc": { ar: "ابدأ المحادثة في هذه القناة", en: "Start chatting in this channel" },
  "chat.inputPlaceholder": { ar: "اكتب رسالة...", en: "Type a message..." },
  "chat.groupIcon": { ar: "أيقونة المجموعة", en: "Group Icon" },
  "chat.groupName": { ar: "اسم المجموعة", en: "Group Name" },
  "chat.groupNamePlaceholder": { ar: "مثال: مجموعة مطورين", en: "e.g. Dev Group" },
  "chat.maxGroups": { ar: "يمكنك إنشاء مجموعتين كحد أقصى", en: "You can create up to 2 groups max" },
  "chat.create": { ar: "إنشاء", en: "Create" },
  "chat.inviteDesc": { ar: "شارك الرمز مع مطورين لدعوتهم (حتى 4 مطورين)", en: "Share the code with developers to invite them (up to 4 devs)" },
  "chat.inviteLink": { ar: "رمز الدعوة", en: "Invite Code" },
  "chat.copy": { ar: "نسخ", en: "Copy" },
  "chat.joinGroup": { ar: "انضم لمجموعة", en: "Join a Group" },
  "chat.enterCode": { ar: "أدخل الرمز", en: "Enter code" },
  "chat.join": { ar: "انضم", en: "Join" },
  "gen.cancel": { ar: "إلغاء", en: "Cancel" },
  "sb.chat": { ar: "المحادثات", en: "Chat" },
  "search.memberCount": { ar: "عضو", en: "members" },
  "search.karmaCount": { ar: "صيت", en: "reputation" },
  // SidebarLeft extra
  "sb.system": { ar: "النظام", en: "System" },
  "sb.createCommunity": { ar: "إنشاء مجتمع جديد", en: "Create Community" },
  // General extra
  "gen.allRightsReserved": { ar: "جميع الحقوق محفوظة.", en: "All rights reserved." },
  // LoginModal
  "lm.title": { ar: "سجّل دخولك للمتابعة", en: "Log in to continue" },
  "lm.subtitle": { ar: "سجّل دخولك لتعليق على المنشورات والتفاعل مع المجتمع", en: "Log in to comment on posts and interact with the community" },
  "lm.continueGoogle": { ar: "تابع مع Google", en: "Continue with Google" },
  "lm.agreement": { ar: "بالضغط على \"تابع مع Google\"، أنت توافق على", en: "By clicking \"Continue with Google\", you agree to the" },
  "lm.and": { ar: "و", en: "and" },
  // ReportModal
  "rm.spam": { ar: "سبام", en: "Spam" },
  "rm.spamDesc": { ar: "محتوى مكرر أو غير مرغوب فيه", en: "Repetitive or unwanted content" },
  "rm.harassment": { ar: "تحرش أو تنمر", en: "Harassment or Bullying" },
  "rm.harassmentDesc": { ar: "استهداف مستخدم بإساءات أو تهديدات", en: "Targeting a user with abuse or threats" },
  "rm.inappropriate": { ar: "محتوى غير لائق", en: "Inappropriate Content" },
  "rm.inappropriateDesc": { ar: "محتوى جنسي أو عنيف أو مسيء", en: "Sexual, violent, or offensive content" },
  "rm.misinfo": { ar: "معلومات مضللة", en: "Misinformation" },
  "rm.misinfoDesc": { ar: "أخبار كاذبة أو معلومات خاطئة", en: "Fake news or incorrect information" },
  "rm.hate": { ar: "خطاب كراهية", en: "Hate Speech" },
  "rm.hateDesc": { ar: "تمييز أو تحريض ضد فئة معينة", en: "Discrimination or incitement against a group" },
  "rm.other": { ar: "سبب آخر", en: "Other" },
  "rm.otherDesc": { ar: "مشكلة غير مذكورة أعلاه", en: "An issue not listed above" },
  "rm.thePost": { ar: "المنشور", en: "the post" },
  "rm.theComment": { ar: "التعليق", en: "the comment" },
  "rm.reportSent": { ar: "تم إرسال التبليغ", en: "Report submitted" },
  "rm.reportThanks": { ar: "شكراً لمساعدتنا في الحفاظ على المجتمع آمناً", en: "Thanks for helping keep the community safe" },
  "rm.stepOf": { ar: "الخطوة", en: "Step" },
  "rm.of": { ar: "من", en: "of" },
  "rm.reportAbout": { ar: "تبليغ عن", en: "Report" },
  "rm.chooseReason": { ar: "اختر سبب التبليغ", en: "Choose a reason for reporting" },
  "rm.confirmReport": { ar: "تأكيد التبليغ", en: "Confirm Report" },
  "rm.writeDetails": { ar: "اكتب تفاصيل إضافية عن المشكلة (اختياري)...", en: "Write additional details about the issue (optional)..." },
  "rm.back": { ar: "رجوع", en: "Back" },
  "rm.report": { ar: "تبليغ", en: "Report" },
  // SettingsPage
  "sp.account": { ar: "الحساب", en: "Account" },
  "sp.appearance": { ar: "المظهر", en: "Appearance" },
  "sp.notifications": { ar: "الإشعارات", en: "Notifications" },
  "sp.privacy": { ar: "الخصوصية", en: "Privacy" },
  "sp.language": { ar: "اللغة", en: "Language" },
  "sp.aboutNF": { ar: "عن نورث فول", en: "About NorthFall" },
  "sp.back": { ar: "العودة", en: "Back" },
  "sp.settings": { ar: "الإعدادات", en: "Settings" },
  "sp.accountInfo": { ar: "معلومات الحساب", en: "Account Info" },
  "sp.displayName": { ar: "اسم العرض", en: "Display Name" },
  "sp.bio": { ar: "نبذة عني", en: "Bio" },
  "sp.bioPlaceholder": { ar: "اكتب نبذة مختصرة عنك...", en: "Write a short bio about yourself..." },
  "sp.socialLinks": { ar: "روابط التواصل الاجتماعي", en: "Social Links" },
  "sp.privateProfile": { ar: "البروفايل خاص", en: "Private Profile" },
  "sp.darkMode": { ar: "الوضع الداكن", en: "Dark Mode" },
  "sp.compactFont": { ar: "تصغير الخط", en: "Compact Font" },
  "sp.notifVotes": { ar: "تصويتات على منشوراتك", en: "Votes on your posts" },
  "sp.notifComments": { ar: "تعليقات على منشوراتك", en: "Comments on your posts" },
  "sp.notifMentions": { ar: "إشارات إليك", en: "Mentions you" },
  "sp.personalWebsite": { ar: "الموقع الشخصي", en: "Personal Website" },
  "sp.hideActivity": { ar: "إخفاء النشاط عن الآخرين", en: "Hide activity from others" },
  "sp.aboutDesc": { ar: "NorthFall هي منصة المجتمعات العربية المفتوحة — مكانك للنقاش، مشاركة الأفكار، وبناء مجتمعات حقيقية.", en: "NorthFall is an open community platform — your place for discussion, sharing ideas, and building real communities." },
  "sp.version": { ar: "الإصدار", en: "Version" },
  // Awards
  "aw.helpful": { ar: "مُفيد", en: "Helpful" },
  "aw.helpfulDesc": { ar: "محتوى ساعد غيره", en: "Content that helped others" },
  "aw.popular": { ar: "مشهور", en: "Popular" },
  "aw.popularDesc": { ar: "حصل على تفاعل كبير", en: "Got a lot of engagement" },
  "aw.creative": { ar: "إبداعي", en: "Creative" },
  "aw.creativeDesc": { ar: "محتوى إبداعي ومميز", en: "Creative and unique content" },
  "aw.active": { ar: "نشيط", en: "Active" },
  "aw.activeDesc": { ar: "مشارك نشيط في المجتمع", en: "Active community member" },
  "aw.leader": { ar: "قائد", en: "Leader" },
  "aw.leaderDesc": { ar: "قيادي في المجتمع", en: "Community leader" },
  "aw.giveAward": { ar: "منح جائزة", en: "Give Award" },
  "aw.chooseAward": { ar: "اختر جائزة لمنحها لهذا المنشور", en: "Choose an award to give this post" },
  "aw.awarded": { ar: "تم منح الجائزة!", en: "Award given!" },
  "aw.awardedDesc": { ar: "شكراً لتقديرك للمحتوى المميز", en: "Thanks for appreciating great content" },
  "pc.awardBtn": { ar: "جائزة", en: "Award" },
  // Share
  "share.title": { ar: "مشاركة المنشور", en: "Share Post" },
  "share.copyLink": { ar: "نسخ الرابط", en: "Copy Link" },
  "share.copied": { ar: "تم النسخ!", en: "Copied!" },
  // ProfilePage extras
  "pp.loginToView": { ar: "سجّل دخولك لمشاهدة ملفك الشخصي", en: "Log in to view your profile" },
  "pp.firstStep": { ar: "الخطوة الأولى", en: "First Step" },
  "pp.firstStepDesc": { ar: "نشرت أول منشور", en: "Published your first post" },
  "gen.minutesAgo": { ar: "دقيقة مضت", en: "min ago" },
  "gen.hoursAgo": { ar: "ساعة مضت", en: "hr ago" },
  "gen.daysAgo": { ar: "يوم مضى", en: "days ago" },
  "gen.monthsAgo": { ar: "شهر مضى", en: "months ago" },
  // PostDetail (new unique keys only - duplicates removed)
  "pd.cancel": { ar: "إلغاء", en: "Cancel" },
  "pd.deleteConfirm": { ar: "هل أنت متأكد من حذف هذا التعليق؟", en: "Are you sure you want to delete this comment?" },
  "pd.saveBtn": { ar: "حفظ", en: "Save" },
  "pd.edit": { ar: "تعديل", en: "Edit" },
  "pd.textCopied": { ar: "تم نسخ النص", en: "Text copied" },
  "pd.saveRemoved": { ar: "تم إزالة الحفظ", en: "Save removed" },
  "pd.postNotFound": { ar: "المنشور غير موجود", en: "Post not found" },
  "pd.backToFeed": { ar: "العودة للفيد", en: "Back to feed" },
  "pd.sendComment": { ar: "إرسال تعليق", en: "Send comment" },
  "pd.vote": { ar: "تصويت", en: "Vote" },
  "pd.minRead": { ar: "د قراءة", en: "min read" },
  "pd.comments": { ar: "تعليق", en: "comments" },
  "pd.openedWhatsapp": { ar: "فتح واتساب", en: "Opened WhatsApp" },
  "pd.openedTelegram": { ar: "فتح تيليجرام", en: "Opened Telegram" },
  "pd.openedX": { ar: "فتح تويتر", en: "Opened X" },
  "pd.embedCopied": { ar: "تم نسخ كود Embed", en: "Embed code copied" },
};

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
}

const I18nContext = createContext<I18nContextType>({
  lang: "ar",
  setLang: () => {},
  t: (key: string) => key,
  dir: "rtl",
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const saved = localStorage.getItem("nf-lang");
    if (saved === "en" || saved === "ar") {
      setLangState(saved);
      document.documentElement.dir = saved === "ar" ? "rtl" : "ltr";
      document.documentElement.classList.toggle("lang-en", saved === "en");
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("nf-lang", l);
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.documentElement.classList.toggle("lang-en", l === "en");
  };

  const t = (key: string): string => {
    const raw = translations[key]?.[lang] || key;
    return lang === "ar" ? plainAr(raw) : raw;
  };

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
