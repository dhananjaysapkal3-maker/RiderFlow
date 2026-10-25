import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ArrowDown, ArrowLeftRight, ArrowRight, AudioLines, Bell, Bot, Bus, Car, Check,
  ChevronDown, Clock3, Compass, Headphones, LocateFixed, MapPin, Menu,
  MessageCircle, Mic, Navigation, Route, Search, ShieldCheck, Sparkles,
  Star, TrainFront, UserRound, Volume2, Plane, X, Zap
} from 'lucide-react';
import './styles.css';
import './product.css';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const SAVED_JOURNEYS_STORAGE_KEY = 'riderflow-saved-journeys';

function apiErrorMessage(error, fallback) {
  if (error instanceof TypeError && /fetch/i.test(error.message)) {
    return 'Cannot connect to the RiderFlow backend. Start it with START_BACKEND.bat, then try again.';
  }
  return error.message || fallback;
}

const HINDI_TRANSLATIONS = {
  'Website language': 'वेबसाइट की भाषा',
  'Website command': 'वेबसाइट निर्देश',
  'English': 'अंग्रेज़ी',
  'Hindi': 'हिन्दी',
  'RiderFlow — Move with confidence': 'राइडरफ़्लो — आत्मविश्वास से यात्रा करें',
  'RiderFlow home': 'राइडरफ़्लो होम',
  'Open route planner': 'यात्रा योजनाकार खोलें',
  'Guest': 'अतिथि',
  'Plan a journey': 'यात्रा की योजना',
  'Safety': 'सुरक्षा',
  'Saved places': 'सहेजे गए स्थान',
  'YOUR AI MOBILITY COMPANION': 'आपका एआई यात्रा साथी',
  'Move smarter.': 'समझदारी से यात्रा करें।',
  'Arrive with confidence.': 'आत्मविश्वास के साथ पहुँचें।',
  "Tell us where you're going. We'll help you find your way, with a little more clarity and a lot more confidence.": 'हमें बताएं कि आप कहाँ जा रहे हैं। हम आपको बेहतर जानकारी और आत्मविश्वास के साथ रास्ता खोजने में मदद करेंगे।',
  'START YOUR JOURNEY': 'अपनी यात्रा शुरू करें',
  'Where to today?': 'आज कहाँ जाना है?',
  'AI assisted': 'एआई सहायता',
  'FROM': 'यहाँ से',
  'TO': 'यहाँ तक',
  'City, address, or landmark in India': 'भारत में शहर, पता या प्रसिद्ध स्थान',
  'Searching places…': 'स्थान खोजे जा रहे हैं…',
  'No matches. Add a city or state to refine your search.': 'कोई परिणाम नहीं। खोज बेहतर करने के लिए शहर या राज्य जोड़ें।',
  'Starting place suggestions': 'शुरुआती स्थान के सुझाव',
  'Destination suggestions': 'गंतव्य के सुझाव',
  'Swap locations': 'स्थान बदलें',
  'Dismiss': 'बंद करें',
  'Locating…': 'स्थान पता किया जा रहा है…',
  'Use my location': 'मेरे स्थान का उपयोग करें',
  'Find my route': 'मेरा रास्ता खोजें',
  'Ask RiderFlow': 'राइडरफ़्लो से पूछें',
  'Ask about travel anywhere in India, or plan a journey': 'भारत में यात्रा के बारे में पूछें या यात्रा की योजना बनाएं',
  'Ask travel questions or try “open Safety”, “change website language to Hindi”, or “save Home at Connaught Place”.': 'यात्रा के बारे में पूछें या “सुरक्षा खोलें”, “वेबसाइट की भाषा हिन्दी करें” या “save Home at Connaught Place” कहकर देखें।',
  'e.g. Find a route from Delhi to Jaipur': 'उदाहरण: दिल्ली से जयपुर का रास्ता खोजें',
  'Speech recognition language': 'बोलकर पहचानने की भाषा',
  'Stop listening': 'सुनना बंद करें',
  'Speak your request': 'अपना अनुरोध बोलें',
  'Stop voice search': 'आवाज़ से खोज बंद करें',
  'Voice search': 'आवाज़ से खोजें',
  'Thinking…': 'सोच रहा है…',
  'Ask AI': 'एआई से पूछें',
  'Type a question or command first.': 'पहले कोई सवाल या निर्देश लिखें।',
  'Listening — speak now. Tap the microphone to stop.': 'सुन रहा है — अब बोलें। रोकने के लिए माइक्रोफ़ोन दबाएं।',
  'TRY ASKING': 'यह पूछकर देखें',
  'How do I get from Delhi to Jaipur?': 'दिल्ली से जयपुर कैसे जाएँ?',
  'Bus options from Pune to Goa': 'पुणे से गोवा के लिए बस विकल्प',
  'Train from Mumbai to Bengaluru': 'मुंबई से बेंगलुरु की ट्रेन',
  'Flights from Chennai to Kolkata': 'चेन्नई से कोलकाता की उड़ानें',
  'Bike options near me': 'मेरे पास बाइक विकल्प',
  'How can I travel more safely?': 'मैं अधिक सुरक्षित यात्रा कैसे करूँ?',
  'Read answer aloud': 'जवाब सुनें',
  'RiderFlow says': 'राइडरफ़्लो का जवाब',
  'TRAVEL COMPARISON · INDIA': 'यात्रा तुलना · भारत',
  'Transport comparisons': 'यात्रा विकल्पों की तुलना',
  'DEMO ESTIMATES · NOT LIVE AVAILABILITY': 'नमूना अनुमान · वास्तविक उपलब्धता नहीं',
  'Transit provider results': 'ट्रांज़िट प्रदाता के परिणाम',
  'Transit data not connected': 'ट्रांज़िट डेटा कनेक्ट नहीं है',
  'Transit provider error': 'ट्रांज़िट प्रदाता में त्रुटि',
  'No transit itinerary returned': 'कोई ट्रांज़िट यात्रा योजना नहीं मिली',
  'Transit provider unavailable': 'ट्रांज़िट प्रदाता उपलब्ध नहीं है',
  'Estimated demo only': 'केवल नमूना अनुमान',
  'Provider itinerary': 'प्रदाता की यात्रा योजना',
  'Checking transit options…': 'ट्रांज़िट विकल्प जाँचे जा रहे हैं…',
  'No verified transit itinerary is available.': 'कोई सत्यापित ट्रांज़िट यात्रा योजना उपलब्ध नहीं है।',
  'Fare not provided by the transit source.': 'ट्रांज़िट स्रोत ने किराया नहीं दिया।',
  'Provider itinerary duration': 'प्रदाता के अनुसार यात्रा अवधि',
  'Provider schedule (UTC)': 'प्रदाता की समय-सारणी (UTC)',
  'Departure': 'प्रस्थान',
  'Arrival': 'आगमन',
  'Services': 'सेवाएँ',
  'more itineraries returned': 'और यात्रा योजनाएँ मिलीं',
  'Transit itineraries are returned by Google Routes API only when configured and available for this area. Schedules may change and are not guaranteed live arrivals. Fare appears only when the provider returns it. Flight and rental values are synthetic demo estimates, not quotes or availability.': 'Google Routes API कॉन्फ़िगर होने और इस क्षेत्र में उपलब्ध होने पर ही ट्रांज़िट यात्रा योजनाएँ दिखाता है। समय-सारणी बदल सकती है और लाइव आगमन की गारंटी नहीं है। किराया केवल तभी दिखेगा जब प्रदाता लौटाएगा। उड़ान और किराये के मान नमूना अनुमान हैं, वास्तविक कोटेशन या उपलब्धता नहीं।',
  'Transit provider request failed. The road route is still available.': 'ट्रांज़िट प्रदाता अनुरोध विफल हुआ। सड़क मार्ग अभी भी उपलब्ध है।',
  'Simulated comparison': 'अनुकरण पर आधारित तुलना',
  'Estimated demo value — not a quote': 'नमूना अनुमान — वास्तविक कोटेशन नहीं',
  'Demo durations and fares are synthetic, distance-based examples—not schedules, confirmed routes, actual fares, availability, or bookings. External links open searches so you can check current services.': 'नमूना अवधि और किराए दूरी पर आधारित उदाहरण हैं—ये समय-सारणी, पुष्ट मार्ग, वास्तविक किराए, उपलब्धता या बुकिंग नहीं हैं। मौजूदा सेवाएँ देखने के लिए बाहरी लिंक खोज खोलते हैं।',
  'YOUR JOURNEY': 'आपकी यात्रा',
  'Journey summary': 'यात्रा सारांश',
  'Route distance': 'मार्ग की दूरी',
  'Estimated driving time': 'ड्राइविंग समय का अनुमान',
  'Estimated walking time': 'पैदल चलने के समय का अनुमान',
  'Estimated arrival time': 'पहुँचने के समय का अनुमान',
  'hr': 'घंटे',
  'Based on the route estimate and calculation time; actual arrival may vary.': 'मार्ग के अनुमान और गणना के समय पर आधारित; वास्तविक आगमन का समय बदल सकता है।',
  'Enable journey alerts': 'यात्रा अलर्ट चालू करें',
  'Enable demo alerts': 'डेमो अलर्ट चालू करें',
  'DEMO MODE': 'डेमो मोड',
  'Sample bus stops remaining': 'डेमो बस स्टॉप शेष',
  'Advance to next sample stop': 'अगले डेमो स्टॉप पर जाएँ',
  'Stop simulation': 'सिमुलेशन रोकें',
  'Resume simulation': 'सिमुलेशन फिर शुरू करें',
  'Reset simulation': 'सिमुलेशन रीसेट करें',
  'Demo alerts are simulated only. No live bus location or service data is used.': 'डेमो अलर्ट केवल सिमुलेशन हैं। बस की लाइव लोकेशन या सेवा डेटा का उपयोग नहीं होता।',
  'Demo alert: 3 sample stops remaining.': 'डेमो अलर्ट: 3 नमूना स्टॉप शेष।',
  'Demo alert: 1 sample stop remaining.': 'डेमो अलर्ट: 1 नमूना स्टॉप शेष।',
  'Demo alert: arrived at the sample destination.': 'डेमो अलर्ट: नमूना गंतव्य पर पहुँच गए।',
  'Your destination is next. Please prepare to get off.': 'आपका गंतव्य अगला है। कृपया उतरने की तैयारी करें।',
  'Voice alerts': 'आवाज़ अलर्ट',
  'Voice on': 'आवाज़ चालू',
  'Voice off': 'आवाज़ बंद',
  'Speech output is not supported in this browser.': 'इस ब्राउज़र में आवाज़ आउटपुट समर्थित नहीं है।',
  'Demo mode. Your destination is next. Please prepare to get off.': 'डेमो मोड। आपका गंतव्य अगला है। कृपया उतरने की तैयारी करें।',
  'Demo mode. You have arrived at the sample destination.': 'डेमो मोड। आप नमूना गंतव्य पर पहुँच गए हैं।',
  'Missed my stop?': 'क्या मेरा स्टॉप छूट गया?',
  'Recovery guidance': 'वापसी मार्गदर्शन',
  'Move to a safe public place and ask transit staff for help. If you want to continue to your planned destination, RiderFlow can calculate a new road route from your current location. This is not live transit guidance.': 'किसी सुरक्षित सार्वजनिक जगह पर जाएँ और ट्रांज़िट कर्मचारियों से मदद लें। यदि आप नियोजित गंतव्य तक जाना चाहते हैं, तो RiderFlow आपके मौजूदा स्थान से नया सड़क मार्ग निकाल सकता है। यह लाइव ट्रांज़िट मार्गदर्शन नहीं है।',
  'Find a route from my current location': 'मेरे मौजूदा स्थान से मार्ग खोजें',
  'Current location is unavailable. Enter your location in the journey planner to calculate a new route.': 'मौजूदा स्थान उपलब्ध नहीं है। नया मार्ग निकालने के लिए यात्रा योजनाकार में अपना स्थान दर्ज करें।',
  'Could not get your current location. Check location permission and try again.': 'आपका मौजूदा स्थान नहीं मिल सका। स्थान अनुमति जाँचकर फिर प्रयास करें।',
  'Location is not supported by this browser. Enter your location in the journey planner to calculate a new route.': 'यह ब्राउज़र स्थान सुविधा का समर्थन नहीं करता। नया मार्ग निकालने के लिए यात्रा योजनाकार में अपना स्थान दर्ज करें।',
  'Locating your current position…': 'आपकी मौजूदा स्थिति का पता लगाया जा रहा है…',
  'Route recalculation started from your current location.': 'आपके मौजूदा स्थान से मार्ग की पुनर्गणना शुरू हुई।',
  'Route options': 'मार्ग विकल्प',
  'options': 'विकल्प',
  'Ready when you are': 'जब आप तैयार हों',
  'Your next journey starts here': 'आपकी अगली यात्रा यहाँ से शुरू होती है',
  'Enter your destination above or ask RiderFlow in your own words to get started.': 'शुरू करने के लिए ऊपर अपना गंतव्य लिखें या अपने शब्दों में राइडरफ़्लो से पूछें।',
  'Time estimates': 'समय का अनुमान',
  'Place search': 'स्थान खोज',
  'Safety first': 'सुरक्षा पहले',
  'Recommended route': 'सुझाया गया मार्ग',
  'Alternative': 'वैकल्पिक मार्ग',
  'min': 'मिनट',
  'km': 'किमी',
  'BEST MATCH': 'सबसे उपयुक्त',
  'Open map': 'नक्शा खोलें',
  'STARTING FROM': 'यहाँ से शुरू',
  'DESTINATION': 'गंतव्य',
  'EXPLORE YOUR WORLD': 'अपनी दुनिया देखें',
  'Journey map': 'यात्रा का नक्शा',
  'Red: recommended route': 'लाल: सुझाया गया मार्ग',
  'India overview': 'भारत का अवलोकन',
  'Your destination is pinned': 'आपका गंतव्य चिह्नित है',
  'A map to get you started': 'शुरू करने के लिए नक्शा',
  'Open the map to explore your route and nearby streets.': 'अपना रास्ता और आसपास की सड़कें देखने के लिए नक्शा खोलें।',
  'Plan a journey to see your destination on the map.': 'नक्शे पर गंतव्य देखने के लिए यात्रा की योजना बनाएं।',
  'RIDERFLOW FEATURES': 'राइडरफ़्लो की सुविधाएँ',
  'Travel tools, all in one place': 'यात्रा के सभी उपकरण एक जगह',
  'AI travel assistant': 'एआई यात्रा सहायक',
  'Ask by text or voice for journey planning and practical travel guidance.': 'यात्रा की योजना और उपयोगी सलाह के लिए लिखकर या बोलकर पूछें।',
  'Available': 'उपलब्ध',
  'Route planning & map': 'मार्ग योजना और नक्शा',
  'Compare available road or walking estimates and explore the map.': 'सड़क या पैदल मार्ग के अनुमान की तुलना करें और नक्शा देखें।',
  'GPS location': 'जीपीएस स्थान',
  'Use your device location as a trip starting point when you grant permission.': 'अनुमति देने पर अपने डिवाइस के स्थान को यात्रा का शुरुआती बिंदु बनाएं।',
  'Browser permission': 'ब्राउज़र अनुमति',
  'Passenger safety': 'यात्री सुरक्षा',
  'Open Safety for journey guidance and a message to share with a trusted contact.': 'यात्रा सलाह और भरोसेमंद संपर्क के साथ संदेश साझा करने के लिए सुरक्षा खोलें।',
  'Keep frequently used destinations in this browser for quick trip planning.': 'यात्रा की जल्दी योजना बनाने के लिए अक्सर उपयोग किए जाने वाले गंतव्य इस ब्राउज़र में रखें।',
  'Deviation alerts': 'मार्ग से भटकने की चेतावनी',
  'Automatic route monitoring and contact alerts are planned, not active yet.': 'स्वचालित मार्ग निगरानी और संपर्क चेतावनियाँ प्रस्तावित हैं, अभी सक्रिय नहीं।',
  'Planned': 'प्रस्तावित',
  'Coming next': 'आगे आने वाली सुविधाएँ',
  'Live transit tracking': 'लाइव सार्वजनिक परिवहन ट्रैकिंग',
  'Schedules, fares & interchanges': 'समय-सारणी, किराए और बदलाव',
  'Time, distance & cost comparisons': 'समय, दूरी और लागत की तुलना',
  'Multilingual AI assistance': 'बहुभाषी एआई सहायता',
  'Live sharing & SOS': 'लाइव साझाकरण और एसओएस',
  'Personalized suggestions': 'व्यक्तिगत सुझाव',
  'Traffic-aware routes': 'यातायात के अनुसार मार्ग',
  'Built for safer, smarter journeys': 'सुरक्षित और समझदार यात्राओं के लिए',
  'Maps © OpenStreetMap contributors': 'नक्शे © OpenStreetMap योगदानकर्ता',
  'YOUR WELLBEING MATTERS': 'आपकी सुरक्षा महत्वपूर्ण है',
  'Safety, built into': 'सुरक्षा, शामिल है',
  'every journey.': 'हर यात्रा में।',
  'Small steps can make every trip feel more predictable. These tools are a prototype, not an emergency service.': 'छोटे कदम हर यात्रा को अधिक भरोसेमंद बना सकते हैं। ये उपकरण शुरुआती रूप में हैं, आपातकालीन सेवा नहीं।',
  'Journey awareness': 'यात्रा की जानकारी',
  'Use the trip planner’s location button when needed. Location access is requested only after you choose it.': 'ज़रूरत पड़ने पर यात्रा योजनाकार का स्थान बटन इस्तेमाल करें। स्थान की अनुमति केवल आपके चुनने पर माँगी जाती है।',
  'Guidance available': 'सलाह उपलब्ध',
  'Trusted contacts': 'भरोसेमंद संपर्क',
  'Prepare a journey message and share it with someone you trust using WhatsApp.': 'यात्रा का संदेश तैयार करें और WhatsApp से किसी भरोसेमंद व्यक्ति के साथ साझा करें।',
  'Prepare share message': 'साझा करने का संदेश तैयार करें',
  'Arrival check-in': 'पहुँचने की सूचना',
  'Set a reminder on your phone to let your trusted contact know when you arrive.': 'पहुँचने पर भरोसेमंद संपर्क को बताने के लिए फ़ोन में रिमाइंडर लगाएँ।',
  'Manual check-in': 'खुद सूचना दें',
  'Route deviation alerts': 'मार्ग से भटकने की चेतावनी',
  'Automatic route monitoring and alerts to you or trusted contacts are planned, but are not active yet.': 'स्वचालित मार्ग निगरानी और आपको या संपर्कों को चेतावनी देना प्रस्तावित है, अभी सक्रिय नहीं।',
  'Important safety note': 'महत्वपूर्ण सुरक्षा सूचना',
  "This prototype does not dispatch emergency services or automatically send live alerts. If you're in immediate danger, contact local emergency services directly.": 'यह शुरुआती संस्करण आपातकालीन सेवाएँ नहीं भेजता और न ही स्वचालित लाइव चेतावनी देता है। तत्काल खतरे में स्थानीय आपातकालीन सेवाओं से सीधे संपर्क करें।',
  'YOUR SHORTLIST': 'आपकी सूची',
  'Your places,': 'आपके स्थान,',
  'all in one place.': 'सब एक जगह।',
  'Save your regular destinations in this browser and add them to a trip whenever you need them.': 'अपने नियमित गंतव्य इस ब्राउज़र में सहेजें और ज़रूरत पड़ने पर यात्रा में जोड़ें।',
  'Place name': 'स्थान का नाम',
  'e.g. Home': 'उदाहरण: घर',
  'Address or landmark': 'पता या प्रसिद्ध स्थान',
  'e.g. Connaught Place, New Delhi': 'उदाहरण: कनॉट प्लेस, नई दिल्ली',
  'Save place': 'स्थान सहेजें',
  'Remove': 'हटाएँ',
  'Driving': 'ड्राइविंग',
  'Walking': 'पैदल',
  'No saved places yet': 'अभी कोई स्थान सहेजा नहीं गया',
  'Add home, college, or another regular destination above.': 'ऊपर घर, कॉलेज या कोई अन्य नियमित गंतव्य जोड़ें।',
  'Close assistant answer': 'सहायक का जवाब बंद करें',
  'Confirm': 'पुष्टि करें',
  'Cancel': 'रद्द करें',
  'Yes, continue': 'हाँ, जारी रखें',
  'No, cancel': 'नहीं, रद्द करें',
  'Please confirm or cancel the pending action.': 'कृपया लंबित कार्रवाई की पुष्टि करें या रद्द करें।',
  'Confirm or cancel': 'पुष्टि करें या रद्द करें',
  'Speech language updated.': 'आवाज़ की भाषा बदल दी गई है।',
  'Reading the answer aloud.': 'जवाब पढ़कर सुनाया जा रहा है।',
  'There is no answer to read yet.': 'अभी सुनाने के लिए कोई जवाब नहीं है।',
  'This place could not be saved. Check your browser storage settings.': 'यह स्थान सहेजा नहीं जा सका। ब्राउज़र की स्टोरेज सेटिंग जाँचें।',
  'Please confirm: use your current location as the starting point?': 'पुष्टि करें: क्या मौजूदा स्थान को शुरुआती बिंदु बनाना है?',
  'Please confirm: save this place?': 'पुष्टि करें: क्या यह स्थान सहेजना है?',
  'Please confirm: remove this saved place?': 'पुष्टि करें: क्या यह सहेजा गया स्थान हटाना है?',
  'What would you like me to do?': 'आप मुझसे क्या करवाना चाहते हैं?',
  'Opening the journey planner.': 'यात्रा योजनाकार खोला जा रहा है।',
  'Opening the safety page.': 'सुरक्षा पेज खोला जा रहा है।',
  'Opening your saved places.': 'आपके सहेजे गए स्थान खोले जा रहे हैं।',
  'Website language set to English.': 'वेबसाइट की भाषा अंग्रेज़ी कर दी गई है।',
  'Website language set to Hindi.': 'वेबसाइट की भाषा हिन्दी कर दी गई है।',
  'Confirmation needed': 'पुष्टि आवश्यक है',
  'Using the speech language menu, choose the language you want to speak.': 'बोलने की भाषा चुनने के लिए आवाज़ भाषा मेनू का उपयोग करें।',
  'I could not find that saved place. Open Saved Places to see your list.': 'वह सहेजा गया स्थान नहीं मिला। सूची देखने के लिए सहेजे गए स्थान खोलें।',
  'I found more than one matching saved place. Please say the exact place name.': 'एक से अधिक सहेजे गए स्थान मिले। कृपया स्थान का सही नाम बताएं।',
  'That command was not clear. Try “open Safety”, “save Home at Connaught Place”, or “plan a route from Delhi to Jaipur”.': 'निर्देश स्पष्ट नहीं है। “सुरक्षा खोलें”, “कनॉट प्लेस पर घर सहेजें” या “दिल्ली से जयपुर का रास्ता बताएं” कहकर देखें।',
  'Saved place added.': 'स्थान सहेज दिया गया।',
  'Saved place removed.': 'सहेजा गया स्थान हटा दिया गया।',
  'Location permission was not granted.': 'स्थान की अनुमति नहीं मिली।',
  'You can ask me to open pages, plan a route, use your location, change the website language, or manage saved places.': 'आप मुझसे पेज खोलने, मार्ग की योजना बनाने, स्थान उपयोग करने, वेबसाइट की भाषा बदलने या सहेजे गए स्थान प्रबंधित करने के लिए कह सकते हैं।',
  'Destination updated from your saved places.': 'सहेजे गए स्थानों से गंतव्य अपडेट किया गया।',
  'Map showing the route from start to destination in red': 'शुरुआत से गंतव्य तक का मार्ग लाल रंग में दिखाने वाला नक्शा',
  'Map of India': 'भारत का नक्शा',
  'Start': 'शुरुआत',
  'Destination': 'गंतव्य',
  'Alternative route': 'वैकल्पिक मार्ग',
  'Road-route estimate from OpenStreetMap/OSRM. It is not a live public-transit itinerary; bus schedules and arrivals need a local transit feed.': 'OpenStreetMap/OSRM पर आधारित सड़क मार्ग का अनुमान। यह सार्वजनिक परिवहन की लाइव यात्रा योजना नहीं है; बस समय-सारणी और आगमन के लिए स्थानीय ट्रांज़िट फ़ीड चाहिए।',
  'Intercity bus': 'अंतरशहरी बस',
  'Train': 'ट्रेन',
  'Flight': 'हवाई जहाज़',
  'Self-drive car rental': 'सेल्फ-ड्राइव कार किराया',
  'Local bus routes and stops are not checked.': 'स्थानीय बस मार्गों और स्टॉप की जाँच नहीं की गई है।',
  'This demo does not verify city-bus stops or services.': 'इस नमूने में शहर की बसों के स्टॉप या सेवाओं की पुष्टि नहीं होती।',
  'Illustrative road-distance estimate; actual operators and routes are not checked.': 'सड़क दूरी पर आधारित अनुमान; वास्तविक संचालकों और मार्गों की जाँच नहीं हुई।',
  'Rail connections are not checked for this short trip.': 'इस छोटी यात्रा के लिए रेल कनेक्शन की जाँच नहीं हुई है।',
  'Check local rail services, if available, with the operator.': 'उपलब्ध होने पर स्थानीय रेल सेवा की जानकारी संचालक से जाँचें।',
  'Illustrative distance-based estimate; railway tracks, stops, and services are not checked.': 'दूरी पर आधारित अनुमान; रेल पटरियों, स्टॉप और सेवाओं की जाँच नहीं हुई है।',
  'Illustrative air-distance fare and time estimate; airports, routes, and flights are not checked.': 'हवाई दूरी पर आधारित किराया और समय का अनुमान; हवाई अड्डों, मार्गों और उड़ानों की जाँच नहीं हुई है।',
  'Compare total journey time, including travel to and from the airports.': 'हवाई अड्डे तक आने-जाने सहित कुल यात्रा समय की तुलना करें।',
  'Sample demo daily rate; pickup location, distance limits, and one-way fees are not checked.': 'नमूना दैनिक दर; पिकअप स्थान, दूरी सीमा और एकतरफ़ा शुल्क की जाँच नहीं हुई है।',
  'Not recommended for this short distance; airport transfers and check-in may take longer than the flight.': 'इतनी कम दूरी के लिए सुझाव नहीं; हवाई अड्डे तक पहुँचना और चेक-इन उड़ान से अधिक समय ले सकता है।',
  'Check bus services': 'बस सेवाएँ देखें',
  'Check IRCTC': 'IRCTC देखें',
  'Check flights': 'उड़ानें देखें',
  'Check car rentals': 'कार किराया देखें',
  'Status: Ready to plan': 'योजना के लिए तैयार',
  'Ready to plan': 'योजना के लिए तैयार',
  'Route ready': 'मार्ग तैयार',
  'Response ready': 'जवाब तैयार',
  'Finding your location…': 'आपका स्थान पता किया जा रहा है…',
  'Current location added': 'मौजूदा स्थान जोड़ा गया',
  'Finding places and calculating route…': 'स्थान खोजे जा रहे हैं और मार्ग निकाला जा रहा है…',
  'Asking RiderFlow…': 'राइडरफ़्लो से पूछा जा रहा है…',
  'Listening — speak now': 'सुन रहा है — अब बोलें',
  'Needs attention': 'ध्यान देना आवश्यक है',
  'Voice input needs attention': 'आवाज़ इनपुट पर ध्यान देना आवश्यक है',
  'INDIA TRAVEL GUIDE': 'भारत यात्रा मार्गदर्शक',
  'CONNECTED AI': 'कनेक्टेड एआई',
  'LOCAL AI': 'लोकल एआई',
  ' per passenger': ' प्रति यात्री',
  ' total': ' कुल',
  ' days': ' दिन',
  ' day': ' दिन',
  'This place could not be saved. Check your browser storage settings.': 'यह स्थान सहेजा नहीं जा सका। ब्राउज़र की स्टोरेज सेटिंग जाँचें।',
  'This place could not be removed. Check your browser storage settings.': 'यह स्थान हटाया नहीं जा सका। ब्राउज़र की स्टोरेज सेटिंग जाँचें।',
  'Enter a name and address to save this place.': 'यह स्थान सहेजने के लिए नाम और पता दर्ज करें।',
  'Enter both a starting point and destination in India.': 'भारत में शुरुआती स्थान और गंतव्य दोनों दर्ज करें।',
  'Location is not supported by this browser.': 'यह ब्राउज़र स्थान सुविधा का समर्थन नहीं करता।',
  'Could not identify your current location.': 'आपके मौजूदा स्थान की पहचान नहीं हो सकी।',
  'Could not get your location. Check your device location settings and try again.': 'आपका स्थान नहीं मिल सका। डिवाइस की स्थान सेटिंग जाँचकर फिर प्रयास करें।',
  'Allow location access in your browser to use your current location.': 'मौजूदा स्थान का उपयोग करने के लिए ब्राउज़र में स्थान अनुमति दें।',
  'Could not connect to the route service. Is the backend running?': 'मार्ग सेवा से संपर्क नहीं हो सका। क्या बैकएंड चल रहा है?',
  'Cannot reach the AI service. Check that the backend is running.': 'एआई सेवा तक पहुँचा नहीं जा सका। जाँचें कि बैकएंड चल रहा है।',
  'Assistant could not answer.': 'सहायक जवाब नहीं दे सका।',
  'Saved places could not be loaded. Clear this site’s storage and try again.': 'सहेजे गए स्थान लोड नहीं हो सके। इस साइट का स्टोरेज साफ़ करके फिर प्रयास करें।',
  'Saved journeys could not be loaded. Clear this site’s storage and try again.': 'सहेजी गई यात्राएँ लोड नहीं हो सकीं। इस साइट का स्टोरेज साफ़ करके फिर प्रयास करें।',
  'This journey could not be saved. Check your browser storage settings.': 'यह यात्रा सहेजी नहीं जा सकी। अपने ब्राउज़र की स्टोरेज सेटिंग जाँचें।',
  'This journey could not be removed. Check your browser storage settings.': 'यह यात्रा हटाई नहीं जा सकी। अपने ब्राउज़र की स्टोरेज सेटिंग जाँचें।',
  'This journey is already saved.': 'यह यात्रा पहले से सहेजी गई है।',
  'Save Journey': 'यात्रा सहेजें',
  'Journey saved': 'यात्रा सहेजी गई',
  'Saved journeys': 'सहेजी गई यात्राएँ',
  'Saved journeys will appear here.': 'सहेजी गई यात्राएँ यहाँ दिखाई देंगी।',
  'Select saved journey': 'सहेजी गई यात्रा चुनें',
  'Website language preference could not be loaded.': 'वेबसाइट की भाषा प्राथमिकता लोड नहीं हो सकी।',
  'Website language preference could not be saved.': 'वेबसाइट की भाषा प्राथमिकता सहेजी नहीं जा सकी।',
  'My planned journey': 'मेरी नियोजित यात्रा',
  'to': 'से',
  "I'll update you when I arrive.": 'पहुँचने पर मैं आपको सूचित करूँगा।'
};

function translate(language, text) {
  return language === 'hi' ? HINDI_TRANSLATIONS[text] || text : text;
}

function formatDemoDuration(hours) {
  const minutes = Math.max(30, Math.round(hours * 60 / 30) * 30);
  const wholeHours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return wholeHours ? `${wholeHours}h${remainingMinutes ? ` ${remainingMinutes}m` : ''}` : `${remainingMinutes}m`;
}

function formatDemoFare(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStraightLineDistanceKm(origin, destination) {
  const radians = degrees => degrees * Math.PI / 180;
  const latitudeDifference = radians(destination.lat - origin.lat);
  const longitudeDifference = radians(destination.lon - origin.lon);
  const haversine = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(radians(origin.lat)) * Math.cos(radians(destination.lat))
    * Math.sin(longitudeDifference / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function formatTransitFare(fare) {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: fare.currency,
      maximumFractionDigits: 2,
    }).format(fare.amount);
  } catch (error) {
    if (error instanceof RangeError) return `${fare.amount} ${fare.currency}`;
    throw error;
  }
}

function formatProviderTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(value));
}

function isValidTransitResponse(data) {
  const isCategory = value => value
    && ['available', 'no_data', 'not_configured', 'error'].includes(value.status)
    && typeof value.message === 'string'
    && Array.isArray(value.options)
    && value.options.every(option => option
      && Number.isFinite(option.duration_min) && option.duration_min > 0
      && (option.fare === null || (option.fare
        && typeof option.fare.currency === 'string'
        && /^[A-Z]{3}$/.test(option.fare.currency)
        && Number.isFinite(option.fare.amount) && option.fare.amount >= 0))
      && (option.departure_time === null || (typeof option.departure_time === 'string' && Number.isFinite(Date.parse(option.departure_time))))
      && (option.arrival_time === null || (typeof option.arrival_time === 'string' && Number.isFinite(Date.parse(option.arrival_time))))
      && Array.isArray(option.lines) && option.lines.every(line => typeof line === 'string'));
  return data
    && data.provider === 'Google Routes API'
    && isCategory(data.bus)
    && isCategory(data.train);
}

function isValidRouteResponse(data) {
  const validCoordinates = point => Array.isArray(point)
    && point.length >= 2
    && Number.isFinite(point[0])
    && Number.isFinite(point[1])
    && point[0] >= -180 && point[0] <= 180
    && point[1] >= -90 && point[1] <= 90;
  return data
    && data.origin && typeof data.origin.name === 'string'
    && validCoordinates([data.origin.lon, data.origin.lat])
    && data.destination && typeof data.destination.name === 'string'
    && validCoordinates([data.destination.lon, data.destination.lat])
    && ['driving', 'walking'].includes(data.mode)
    && Array.isArray(data.routes) && data.routes.length > 0
    && data.routes.every(route => route
      && Number.isFinite(route.distance_km) && route.distance_km >= 0
      && Number.isFinite(route.duration_min) && route.duration_min >= 0
      && route.geometry && route.geometry.type === 'LineString'
      && Array.isArray(route.geometry.coordinates) && route.geometry.coordinates.length >= 2
      && route.geometry.coordinates.every(validCoordinates))
    && typeof data.notice === 'string';
}

function isValidSavedJourneys(data) {
  const isLocation = location => location
    && typeof location.name === 'string'
    && location.name.trim()
    && Number.isFinite(location.lat) && location.lat >= -90 && location.lat <= 90
    && Number.isFinite(location.lon) && location.lon >= -180 && location.lon <= 180;
  return Array.isArray(data) && data.every(journey =>
    journey && typeof journey.id === 'string'
    && isLocation(journey.origin) && isLocation(journey.destination)
    && ['driving', 'walking'].includes(journey.mode)
  );
}

function getDemoTravelOptions(routeData) {
  const {origin, destination, routes} = routeData;
  const roadDistance = routes[0]?.distance_km || 0;
  const airDistance = getStraightLineDistanceKm(origin, destination);
  const endpoints = `${origin.name} to ${destination.name}`;
  const query = term => `https://www.google.com/search?q=${encodeURIComponent(`${term} ${endpoints}`)}`;
  const railDistance = airDistance * 1.25;
  const flightDuration = airDistance / 650 + 2.5;
  const flightNote = airDistance < 150
    ? 'Not recommended for this short distance; airport transfers and check-in may take longer than the flight.'
    : flightDuration >= 6
      ? `Long travel time: allow about ${formatDemoDuration(flightDuration)}, including estimated airport time.`
      : 'Compare total journey time, including travel to and from the airports.';
  const rentalDays = Math.max(1, Math.ceil(roadDistance / 300));

  return [
    {
      id: 'flight',
      name: 'Flight',
      icon: Plane,
      estimate: `${formatDemoDuration(flightDuration)} · ${formatDemoFare(2500 + airDistance * 2.5)}–${formatDemoFare(4500 + airDistance * 5)} per passenger`,
      detail: 'Illustrative air-distance fare and time estimate; airports, routes, and flights are not checked.',
      note: flightNote,
      noteTone: airDistance < 150 ? 'not-recommended' : flightDuration >= 6 ? 'long-journey' : '',
      link: query('flights'),
      action: 'Check flights',
    },
    {
      id: 'rental',
      name: 'Self-drive car rental',
      icon: Car,
      estimate: `${rentalDays} day${rentalDays === 1 ? '' : 's'} · ${formatDemoFare(rentalDays * 2500)}–${formatDemoFare(rentalDays * 5000)} total`,
      detail: 'Sample demo daily rate; pickup location, distance limits, and one-way fees are not checked.',
      link: query('self drive car rental'),
      action: 'Check car rentals',
    },
  ];
}

function getTransitTravelOptions(routeData, transitData, loading, error) {
  const roadDistance = routeData.routes[0]?.distance_km;
  const railDistance = getStraightLineDistanceKm(routeData.origin, routeData.destination) * 1.25;
  const fareRange = (distanceKm, minimumRate, maximumRate) => Number.isFinite(distanceKm) && distanceKm > 0
    ? `${formatDemoFare(distanceKm * minimumRate)}–${formatDemoFare(distanceKm * maximumRate)} per passenger`
    : 'Fare estimate unavailable for this route.';
  const busFareEstimate = fareRange(roadDistance, 2, 4);
  const trainFareEstimate = fareRange(railDistance, 0.5, 1.5);
  const busRouteSlug = name => /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/.test(name.trim())
    ? name.trim().toLowerCase().replace(/[ ]+/g, '-')
    : null;
  const originSlug = busRouteSlug(routeData.origin.name);
  const destinationSlug = busRouteSlug(routeData.destination.name);
  const busLink = originSlug && destinationSlug
    ? `https://www.redbus.in/bus-tickets/${encodeURIComponent(originSlug)}-to-${encodeURIComponent(destinationSlug)}`
    : 'https://www.redbus.in/';
  return [
    {
      id: 'bus', name: 'Intercity bus', icon: Bus, data: transitData?.bus,
      link: busLink, action: 'Check bus services',
      fallbackFare: busFareEstimate,
      fareDisclaimer: 'Estimated fare — not a live quote. Check the booking site for current prices.',
      fareMethod: 'Estimate uses OSRM road-route distance × ₹2–₹4/km; operators and fares are not checked.',
    },
    {
      id: 'train', name: 'Train', icon: TrainFront, data: transitData?.train,
      link: 'https://www.irctc.co.in/', action: 'Check IRCTC',
      fallbackFare: trainFareEstimate,
      fareDisclaimer: 'Estimated fare — fares vary by train, class, station and date.',
      fareMethod: 'Estimate uses straight-line distance × 1.25 as an approximate rail distance, then ₹0.50–₹1.50/km; tracks, stops and services are not checked.',
    },
  ].map(option => {
    const result = option.data;
    const firstItinerary = result?.options?.[0];
    const hasProviderFare = result?.status === 'available' && firstItinerary?.fare;
    const estimate = result?.status === 'available' && firstItinerary
      ? `${firstItinerary.duration_min} min · ${hasProviderFare ? formatTransitFare(firstItinerary.fare) : option.fallbackFare}`
      : option.fallbackFare;
    return {
      ...option,
      estimate,
      source: hasProviderFare ? 'Provider itinerary' : 'Estimated fare — not a live quote',
      fareDisclaimer: hasProviderFare ? '' : option.fareDisclaimer,
      detail: firstItinerary?.lines?.length
        ? `${firstItinerary.lines.join(', ')}${result.options.length > 1 ? ` · ${result.options.length - 1} more itineraries returned` : ''}`
        : '',
      fareMethod: hasProviderFare ? '' : option.fareMethod,
      departure: firstItinerary?.departure_time || null,
      arrival: firstItinerary?.arrival_time || null,
    };
  });
}

function JourneyMap({routeData, language}) {
  const t = text => translate(language, text);
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const routeLayersRef = useRef([]);

  useEffect(() => {
    if (!mapElementRef.current) return undefined;
    const map = L.map(mapElementRef.current, {scrollWheelZoom: false, zoomControl: true}).setView([22.5, 79], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    }).addTo(map);
    mapRef.current = map;
    const resizeObserver = new ResizeObserver(() => map.invalidateSize({pan: false}));
    resizeObserver.observe(mapElementRef.current);

    return () => {
      resizeObserver.disconnect();
      routeLayersRef.current = [];
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    routeLayersRef.current.forEach(layer => map.removeLayer(layer));
    routeLayersRef.current = [];

    if (!routeData) {
      map.setView([22.5, 79], 4);
      map.invalidateSize();
      return;
    }

    const layers = [];
    const toLatLngs = route => (route.geometry?.coordinates || [])
      .filter(point => Array.isArray(point) && Number.isFinite(point[0]) && Number.isFinite(point[1]))
      .map(([longitude, latitude]) => [latitude, longitude]);

    routeData.routes.slice(1).forEach(route => {
      const coordinates = toLatLngs(route);
      if (coordinates.length > 1) {
        layers.push(L.polyline(coordinates, {
          color: '#8492a6',
          opacity: 0.65,
          weight: 4,
          dashArray: '7 7',
        }).addTo(map));
      }
    });

    const primaryRoute = toLatLngs(routeData.routes[0] || {});
    if (primaryRoute.length > 1) {
      layers.push(L.polyline(primaryRoute, {
        color: '#e53935',
        opacity: 0.95,
        weight: 6,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map));
    }

    const start = [routeData.origin.lat, routeData.origin.lon];
    const end = [routeData.destination.lat, routeData.destination.lon];
    layers.push(L.circleMarker(start, {
      radius: 8,
      color: '#fff',
      weight: 3,
      fillColor: '#168653',
      fillOpacity: 1,
    }).addTo(map).bindTooltip(t('Start'), {direction: 'top', offset: [0, -7]}));
    layers.push(L.circleMarker(end, {
      radius: 8,
      color: '#fff',
      weight: 3,
      fillColor: '#e53935',
      fillOpacity: 1,
    }).addTo(map).bindTooltip(t('Destination'), {direction: 'top', offset: [0, -7]}));

    routeLayersRef.current = layers;
    const bounds = L.latLngBounds([start, end]);
    layers.forEach(layer => {
      if (typeof layer.getBounds === 'function') bounds.extend(layer.getBounds());
    });
    map.fitBounds(bounds, {padding: [28, 28], maxZoom: 14});
    map.invalidateSize();
  }, [routeData, language]);

  return <div ref={mapElementRef} className="leaflet-map" role="img" aria-label={t(routeData ? 'Map showing the route from start to destination in red' : 'Map of India')} />;
}

function App() {
  const [language, setLanguage] = useState('en');
  const [languageReady, setLanguageReady] = useState(false);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [activePlaceField, setActivePlaceField] = useState('');
  const [placeResults, setPlaceResults] = useState([]);
  const [placeSearchBusy, setPlaceSearchBusy] = useState(false);
  const [placeSearchDone, setPlaceSearchDone] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('driving');
  const [routeData, setRouteData] = useState(null);
  const [routeCalculatedAt, setRouteCalculatedAt] = useState(null);
  const [demoAlertsEnabled, setDemoAlertsEnabled] = useState(false);
  const [demoAlertsRunning, setDemoAlertsRunning] = useState(false);
  const [demoStopsRemaining, setDemoStopsRemaining] = useState(5);
  const [demoAlertMessage, setDemoAlertMessage] = useState('');
  const [demoVoiceEnabled, setDemoVoiceEnabled] = useState(false);
  const demoMilestonesRef = useRef(new Set());
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [transitData, setTransitData] = useState(null);
  const [transitLoading, setTransitLoading] = useState(false);
  const [transitError, setTransitError] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiMode, setAiMode] = useState('');
  const [pendingCommand, setPendingCommand] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('route');
  const [showAssistant, setShowAssistant] = useState(false);
  const [status, setStatus] = useState('Ready to plan');
  const [isListening, setIsListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState('');
  const [voiceFailed, setVoiceFailed] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState('en-IN');
  const recognitionRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [savedJourneys, setSavedJourneys] = useState([]);
  const [savedPlaceName, setSavedPlaceName] = useState('');
  const [savedPlaceAddress, setSavedPlaceAddress] = useState('');

  useEffect(() => {
    try {
      const storedLanguage = localStorage.getItem('riderflow-language');
      if (storedLanguage === 'en' || storedLanguage === 'hi') setLanguage(storedLanguage);
    } catch {
      setError('Website language preference could not be loaded.');
    }
    setLanguageReady(true);
  }, []);

  useEffect(() => {
    try {
      const storedJourneys = JSON.parse(localStorage.getItem(SAVED_JOURNEYS_STORAGE_KEY) || '[]');
      if (!isValidSavedJourneys(storedJourneys)) throw new Error('Saved journeys data is invalid.');
      setSavedJourneys(storedJourneys);
    } catch {
      setError('Saved journeys could not be loaded. Clear this site’s storage and try again.');
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = translate(language, 'RiderFlow — Move with confidence');
    if (!languageReady) return;
    try {
      localStorage.setItem('riderflow-language', language);
    } catch {
      setError('Website language preference could not be saved.');
    }
  }, [language, languageReady]);

  const t = text => translate(language, text);

  useEffect(() => {
    try {
      const storedPlaces = JSON.parse(localStorage.getItem('riderflow-saved-places') || '[]');
      if (!Array.isArray(storedPlaces) || !storedPlaces.every(place =>
        place && typeof place.id === 'string' && typeof place.name === 'string' && typeof place.address === 'string'
      )) throw new Error('Saved places data is invalid.');
      setSavedPlaces(storedPlaces);
    } catch {
      setError('Saved places could not be loaded. Clear this site’s storage and try again.');
    }
  }, []);

  useEffect(() => {
    if (!routeData) {
      setTransitData(null);
      setTransitLoading(false);
      setTransitError('');
      return undefined;
    }
    const controller = new AbortController();
    setTransitData(null);
    setTransitError('');
    setTransitLoading(true);
    (async () => {
      try {
        const response = await fetch(`${API}/api/transit/options`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          signal: controller.signal,
          body: JSON.stringify({
            origin_lat: routeData.origin.lat,
            origin_lon: routeData.origin.lon,
            destination_lat: routeData.destination.lat,
            destination_lon: routeData.destination.lon,
          }),
        });
        let data;
        try {
          data = await response.json();
        } catch {
          throw new Error('The transit provider returned an unreadable response.');
        }
        if (!response.ok) throw new Error(data.detail || 'Transit provider request failed.');
        if (!isValidTransitResponse(data)) throw new Error('The transit provider returned incomplete or invalid data.');
        setTransitData(data);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setTransitError(apiErrorMessage(error, 'Transit provider request failed. The road route is still available.'));
        }
      } finally {
        if (!controller.signal.aborted) setTransitLoading(false);
      }
    })();
    return () => controller.abort();
  }, [routeData]);

  const activePlaceQuery = activePlaceField === 'origin' ? origin : destination;
  useEffect(() => {
    if (!activePlaceField || activePlaceQuery.trim().length < 3) {
      setPlaceResults([]);
      setPlaceSearchBusy(false);
      setPlaceSearchDone(false);
      return undefined;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setPlaceSearchBusy(true);
      setPlaceSearchDone(false);
      setPlaceResults([]);
      try {
        const response = await fetch(`${API}/api/places?q=${encodeURIComponent(activePlaceQuery.trim())}`, {signal: controller.signal});
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Place search is unavailable.');
        setPlaceResults(data.results || []);
        setPlaceSearchDone(true);
      } catch (e) {
        if (e.name !== 'AbortError') {
          setPlaceResults([]);
          setError(apiErrorMessage(e, 'Could not search places. Check your connection and try again.'));
        }
      } finally {
        if (!controller.signal.aborted) setPlaceSearchBusy(false);
      }
    }, 1000);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [activePlaceField, activePlaceQuery]);

  function selectPlace(field, place) {
    const selectedPlace = {...place, query: activePlaceQuery};
    if (field === 'origin') {
      setOrigin(place.name);
      setSelectedOrigin(selectedPlace);
    } else {
      setDestination(place.name);
      setSelectedDestination(selectedPlace);
    }
    setPlaceResults([]);
    setPlaceSearchDone(false);
    setActivePlaceField('');
    setError('');
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError('Location is not supported by this browser.');
      return;
    }
    setError('');
    setLocationBusy(true);
    setStatus('Finding your location…');
    navigator.geolocation.getCurrentPosition(async ({coords}) => {
      try {
        const params = new URLSearchParams({lat: String(coords.latitude), lon: String(coords.longitude)});
        const response = await fetch(`${API}/api/location/reverse?${params}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Could not identify your current location.');
        setOrigin(data.name);
        setSelectedOrigin(data);
        setRouteData(null);
        setStatus('Current location added');
      } catch (e) {
        setError(apiErrorMessage(e, 'Could not identify your current location.'));
        setStatus('Needs attention');
      } finally {
        setLocationBusy(false);
      }
    }, e => {
      setError(e.code === 1 ? 'Allow location access in your browser to use your current location.' : 'Could not get your location. Check your device location settings and try again.');
      setStatus('Needs attention');
      setLocationBusy(false);
    }, {enableHighAccuracy: true, timeout: 12000, maximumAge: 60000});
  }

  function savePlaceValues(nameValue, addressValue) {
    const name = nameValue.trim();
    const address = addressValue.trim();
    if (!name || !address) {
      setError('Enter a name and address to save this place.');
      return;
    }
    const nextPlaces = [...savedPlaces, {id: `${Date.now()}`, name, address}];
    try {
      localStorage.setItem('riderflow-saved-places', JSON.stringify(nextPlaces));
    } catch {
      setError('This place could not be saved. Check your browser storage settings.');
      return;
    }
    setSavedPlaces(nextPlaces);
    setSavedPlaceName('');
    setSavedPlaceAddress('');
    setError('');
    return true;
  }

  function savePlace() {
    savePlaceValues(savedPlaceName, savedPlaceAddress);
  }

  function removeSavedPlace(id) {
    const nextPlaces = savedPlaces.filter(place => place.id !== id);
    try {
      localStorage.setItem('riderflow-saved-places', JSON.stringify(nextPlaces));
    } catch {
      setError('This place could not be removed. Check your browser storage settings.');
      return false;
    }
    setSavedPlaces(nextPlaces);
    setError('');
    return true;
  }

  const journeyAlreadySaved = isValidRouteResponse(routeData) && savedJourneys.some(journey =>
    journey.origin.name.trim().toLocaleLowerCase() === routeData.origin.name.trim().toLocaleLowerCase()
    && journey.destination.name.trim().toLocaleLowerCase() === routeData.destination.name.trim().toLocaleLowerCase()
  );

  function saveJourney() {
    if (!isValidRouteResponse(routeData) || !routeData.origin.name.trim() || !routeData.destination.name.trim()) return;
    if (journeyAlreadySaved) {
      setError('This journey is already saved.');
      return;
    }
    const journey = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      origin: {name: routeData.origin.name, lat: routeData.origin.lat, lon: routeData.origin.lon},
      destination: {name: routeData.destination.name, lat: routeData.destination.lat, lon: routeData.destination.lon},
      mode: routeData.mode,
    };
    const nextJourneys = [...savedJourneys, journey];
    try {
      localStorage.setItem(SAVED_JOURNEYS_STORAGE_KEY, JSON.stringify(nextJourneys));
    } catch {
      setError('This journey could not be saved. Check your browser storage settings.');
      return;
    }
    setSavedJourneys(nextJourneys);
    setError('');
  }

  function removeSavedJourney(id) {
    const nextJourneys = savedJourneys.filter(journey => journey.id !== id);
    try {
      localStorage.setItem(SAVED_JOURNEYS_STORAGE_KEY, JSON.stringify(nextJourneys));
    } catch {
      setError('This journey could not be removed. Check your browser storage settings.');
      return false;
    }
    setSavedJourneys(nextJourneys);
    setError('');
    return true;
  }

  function selectSavedJourney(journey) {
    setOrigin(journey.origin.name);
    setDestination(journey.destination.name);
    setSelectedOrigin({...journey.origin, query: journey.origin.name});
    setSelectedDestination({...journey.destination, query: journey.destination.name});
    setMode(journey.mode);
    setRouteData(null);
    setRouteCalculatedAt(null);
    setError('');
    setActivePlaceField('');
    setPlaceResults([]);
    setTab('route');
  }

  function resetDemoAlerts() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setDemoAlertsEnabled(false);
    setDemoAlertsRunning(false);
    setDemoStopsRemaining(5);
    setDemoAlertMessage('');
    setDemoVoiceEnabled(false);
    demoMilestonesRef.current.clear();
  }

  function enableDemoAlerts() {
    demoMilestonesRef.current.clear();
    setDemoStopsRemaining(5);
    setDemoAlertMessage('');
    setDemoAlertsEnabled(true);
    setDemoAlertsRunning(true);
  }

  function advanceDemoStop() {
    if (!demoAlertsRunning || demoStopsRemaining <= 0) return;
    const remaining = demoStopsRemaining - 1;
    setDemoStopsRemaining(remaining);
    const milestoneMessage = {
      3: 'Demo alert: 3 sample stops remaining.',
      1: 'Your destination is next. Please prepare to get off.',
      0: 'Demo alert: arrived at the sample destination.',
    }[remaining];
    if (milestoneMessage && !demoMilestonesRef.current.has(remaining)) {
      demoMilestonesRef.current.add(remaining);
      setDemoAlertMessage(milestoneMessage);
      if (demoVoiceEnabled && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
        const announcement = remaining === 1
          ? 'Demo mode. Your destination is next. Please prepare to get off.'
          : remaining === 0
            ? 'Demo mode. You have arrived at the sample destination.'
            : `Demo mode. ${milestoneMessage}`;
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(t(announcement)));
      }
    }
    if (remaining === 0) setDemoAlertsRunning(false);
  }

  function resetDemoSimulation() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    demoMilestonesRef.current.clear();
    setDemoStopsRemaining(5);
    setDemoAlertsRunning(false);
    setDemoAlertMessage('');
  }

  function toggleDemoVoice() {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    if (demoVoiceEnabled) window.speechSynthesis.cancel();
    setDemoVoiceEnabled(!demoVoiceEnabled);
  }

  function recoverMissedStop() {
    setRecoveryMessage('Locating your current position…');
    if (!isValidRouteResponse(routeData)) {
      setRecoveryMessage('Current location is unavailable. Enter your location in the journey planner to calculate a new route.');
      return;
    }
    if (!navigator.geolocation) {
      setRecoveryMessage('Location is not supported by this browser. Enter your location in the journey planner to calculate a new route.');
      return;
    }
    navigator.geolocation.getCurrentPosition(({coords}) => {
      if (!Number.isFinite(coords.latitude) || coords.latitude < -90 || coords.latitude > 90
        || !Number.isFinite(coords.longitude) || coords.longitude < -180 || coords.longitude > 180) {
        setRecoveryMessage('Could not get your current location. Check location permission and try again.');
        return;
      }
      setRecoveryMessage('Route recalculation started from your current location.');
      setSelectedOrigin({lat: coords.latitude, lon: coords.longitude, query: 'Current location'});
      setSelectedDestination({
        lat: routeData.destination.lat,
        lon: routeData.destination.lon,
        query: routeData.destination.name,
      });
      setTab('route');
      planRoute('Current location', routeData.destination.name, routeData.mode, {
        origin: {lat: coords.latitude, lon: coords.longitude, query: 'Current location'},
        destination: {
          lat: routeData.destination.lat,
          lon: routeData.destination.lon,
          query: routeData.destination.name,
        },
      });
    }, () => {
      setRecoveryMessage('Could not get your current location. Check location permission and try again.');
    }, {enableHighAccuracy: true, timeout: 12000, maximumAge: 60000});
  }

  async function planRoute(o = origin, d = destination, selectedMode = mode, locations = {origin: selectedOrigin, destination: selectedDestination}) {
    resetDemoAlerts();
    if (!o.trim() || !d.trim()) {
      setError('Enter both a starting point and destination in India.');
      setRouteData(null);
      return;
    }
    setBusy(true); setError(''); setStatus('Finding places and calculating route…');
    setRouteData(null);
    try {
      const res = await fetch(`${API}/api/route`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          origin:o, destination:d, mode:selectedMode,
          origin_lat:locations.origin?.lat, origin_lon:locations.origin?.lon,
          destination_lat:locations.destination?.lat, destination_lon:locations.destination?.lon,
          origin_label:locations.origin?.query || o,
          destination_label:locations.destination?.query || d
        })
      });
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error('The route service returned an unreadable response. Please try again.');
      }
      if (!res.ok) throw new Error(data.detail || 'Could not calculate this route.');
      if (!isValidRouteResponse(data)) throw new Error('The route service returned incomplete or invalid route data. Please try again.');
      setRouteData(data); setRouteCalculatedAt(Date.now()); setOrigin(o); setDestination(d); setStatus('Route ready');
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not connect to the route service. Is the backend running?'));
      setStatus('Needs attention');
    } finally { setBusy(false); }
  }

  async function askAI(text = prompt) {
    if (!text.trim()) {
      setAiAnswer(t('Type a question or command first.'));
      setShowAssistant(true);
      return;
    }
    const message = text.trim();
    const normalizedMessage = message.replace(/[.!?]+$/g, '').trim();
    const affirmative = /^(yes|yeah|yep|confirm|do it|go ahead|हाँ|हां|जी हाँ)$/i.test(normalizedMessage);
    const negative = /^(no|nope|cancel|stop|don't|नहीं|रद्द करें)$/i.test(normalizedMessage);

    if (pendingCommand) {
      if (affirmative) {
        const command = pendingCommand;
        setPendingCommand(null);
        if (command.type === 'location') {
          setTab('route');
          setShowAssistant(false);
          useCurrentLocation();
          return;
        }
        if (command.type === 'save-place') {
          if (savePlaceValues(command.name, command.address)) {
            setAiAnswer(t('Saved place added.'));
            setStatus('Response ready');
          }
        } else if (command.type === 'remove-place') {
          if (removeSavedPlace(command.id)) {
            setAiAnswer(t('Saved place removed.'));
            setStatus('Response ready');
          }
        }
        setShowAssistant(true);
        return;
      }
      if (negative) {
        setPendingCommand(null);
        setAiAnswer(t('No, cancel'));
        setStatus('Response ready');
        setShowAssistant(true);
        return;
      }
      setAiAnswer(t('Please confirm or cancel the pending action.'));
      setShowAssistant(true);
      return;
    }

    const respondToCommand = (response, status = 'Response ready') => {
      setAiAnswer(t(response));
      setPendingCommand(null);
      setError('');
      setShowAssistant(true);
      setStatus(status);
    };
    const saveMatch = normalizedMessage.match(/^(?:please\s+)?save\s+(?:place\s+)?(.+?)\s+(?:at|as)\s+(.+)$/i)
      || normalizedMessage.match(/^(.+?)\s+को\s+(.+?)\s+पर\s+सहेजें$/);
    if (saveMatch) {
      const [, name, address] = saveMatch;
      setPendingCommand({type: 'save-place', name: name.trim(), address: address.trim()});
      setAiAnswer(`${t('Please confirm: save this place?')} ${name.trim()} — ${address.trim()}`);
      setShowAssistant(true);
      setStatus('Confirmation needed');
      return;
    }

    const removeMatch = normalizedMessage.match(/^(?:please\s+)?(?:delete|remove)\s+(?:the\s+)?(?:saved place\s+)?(.+?)(?:\s+from\s+(?:my\s+)?saved places)?$/i)
      || normalizedMessage.match(/^(?:सहेजे गए स्थान से\s+)?(.+?)\s+(?:हटाएं|हटाएँ|मिटाएं|मिटाएँ)$/);
    if (removeMatch && (/\b(delete|remove)\b/i.test(normalizedMessage) || /(?:हटाएं|हटाएँ|मिटाएं|मिटाएँ)$/.test(normalizedMessage))) {
      const requestedName = removeMatch[1].trim().toLocaleLowerCase();
      const matches = savedPlaces.filter(place => place.name.trim().toLocaleLowerCase() === requestedName);
      if (matches.length === 1) {
        setPendingCommand({type: 'remove-place', id: matches[0].id});
        setAiAnswer(`${t('Please confirm: remove this saved place?')} ${matches[0].name}`);
        setShowAssistant(true);
        setStatus('Confirmation needed');
      } else {
        respondToCommand(matches.length ? 'I found more than one matching saved place. Please say the exact place name.' : 'I could not find that saved place. Open Saved Places to see your list.');
      }
      return;
    }

    const destinationMatch = normalizedMessage.match(/^(?:set|use|make)\s+(.+?)\s+as\s+(?:my\s+)?destination$/i);
    if (destinationMatch) {
      const requestedName = destinationMatch[1].trim().toLocaleLowerCase();
      const place = savedPlaces.find(saved => saved.name.trim().toLocaleLowerCase() === requestedName);
      if (!place) {
        respondToCommand('I could not find that saved place. Open Saved Places to see your list.');
        return;
      }
      setDestination(place.address);
      setSelectedDestination(null);
      setRouteData(null);
      setTab('route');
      respondToCommand('Destination updated from your saved places.');
      return;
    }

    if (/^(?:use|set)\s+(?:my\s+)?(?:current\s+)?location(?:\s+as\s+(?:my\s+)?starting point)?$/i.test(normalizedMessage)
      || /^(?:find|use)\s+my\s+location$/i.test(normalizedMessage)
      || /^(?:मेरा स्थान उपयोग करें|मेरी वर्तमान जगह उपयोग करें|मेरे वर्तमान स्थान का उपयोग करें)$/i.test(normalizedMessage)) {
      setPendingCommand({type: 'location'});
      setAiAnswer(t('Please confirm: use your current location as the starting point?'));
      setShowAssistant(true);
      setStatus('Confirmation needed');
      return;
    }

    const languageMatch = normalizedMessage.match(/^(?:please\s+)?(?:change|switch|set)\s+(?:the\s+)?(?:website\s+)?language\s+(?:to\s+)?(hindi|english)$/i)
      || normalizedMessage.match(/^(?:change|switch|set)\s+(?:the\s+)?(?:website\s+)?to\s+(hindi|english)$/i)
      || normalizedMessage.match(/^(?:हिन्दी|हिंदी|hindi)\s+(?:भाषा\s+)?(?:करें|चुनें|में बदलें)$/i)
      || normalizedMessage.match(/^(?:english|अंग्रेज़ी)\s+(?:भाषा\s+)?(?:करें|चुनें|में बदलें)$/i)
      || normalizedMessage.match(/^वेबसाइट\s+की\s+भाषा\s+(हिन्दी|हिंदी|अंग्रेज़ी)\s+करें$/i);
    if (languageMatch) {
      const requestedLanguage = /^(hindi|हिन्दी|हिंदी)$/i.test(languageMatch[1] || normalizedMessage.split(/\s+/)[0]) ? 'hi' : 'en';
      setLanguage(requestedLanguage);
      setAiAnswer(translate(requestedLanguage, requestedLanguage === 'hi' ? 'Website language set to Hindi.' : 'Website language set to English.'));
      setPendingCommand(null);
      setError('');
      setShowAssistant(true);
      setStatus('Response ready');
      return;
    }

    const speechLanguageNames = {
      english: 'en-IN', hindi: 'hi-IN', bengali: 'bn-IN', marathi: 'mr-IN',
      tamil: 'ta-IN', telugu: 'te-IN', gujarati: 'gu-IN', kannada: 'kn-IN',
      malayalam: 'ml-IN', punjabi: 'pa-IN'
    };
    const speechLanguageMatch = normalizedMessage.match(/^(?:use|set|change|speak(?:\s+in)?)\s+(?:voice\s+)?(?:language\s+to\s+)?(english|hindi|bengali|marathi|tamil|telugu|gujarati|kannada|malayalam|punjabi)$/i)
      || normalizedMessage.match(/^(?:use|set|change)\s+(english|hindi|bengali|marathi|tamil|telugu|gujarati|kannada|malayalam|punjabi)\s+(?:for\s+)?(?:voice|speech)(?:\s+recognition)?$/i)
      || normalizedMessage.match(/^(अंग्रेज़ी|हिंदी|हिन्दी|बंगाली|मराठी|तमिल|तेलुगु|गुजराती|कन्नड़|मलयालम|पंजाबी)\s+में\s+बोलें$/);
    if (speechLanguageMatch) {
      const localizedSpeechLanguages = {
        'अंग्रेज़ी': 'en-IN', 'हिंदी': 'hi-IN', 'हिन्दी': 'hi-IN', 'बंगाली': 'bn-IN',
        'मराठी': 'mr-IN', 'तमिल': 'ta-IN', 'तेलुगु': 'te-IN', 'गुजराती': 'gu-IN',
        'कन्नड़': 'kn-IN', 'मलयालम': 'ml-IN', 'पंजाबी': 'pa-IN'
      };
      setVoiceLanguage(speechLanguageNames[speechLanguageMatch[1].toLowerCase()] || localizedSpeechLanguages[speechLanguageMatch[1]]);
      respondToCommand('Speech language updated.');
      return;
    }

    if (/^(?:read|speak)\s+(?:the\s+)?(?:last\s+)?answer(?:\s+aloud)?$/i.test(normalizedMessage)) {
      if (aiAnswer) speak(aiAnswer);
      respondToCommand(aiAnswer ? 'Reading the answer aloud.' : 'There is no answer to read yet.');
      return;
    }

    const savedPlaceCommand = normalizedMessage.match(/^(?:take me to|go to|navigate to|open)\s+(.+)$/i);
    if (savedPlaceCommand) {
      const requestedName = savedPlaceCommand[1].replace(/^(?:my\s+)?saved place\s+/i, '').trim().toLocaleLowerCase();
      const place = savedPlaces.find(saved => saved.name.trim().toLocaleLowerCase() === requestedName);
      if (place) {
        setDestination(place.address);
        setSelectedDestination(null);
        setRouteData(null);
        setTab('route');
        respondToCommand('Destination updated from your saved places.');
        return;
      }
    }

    if (/^(?:open|show|go to|switch to|take me to)\s+(?:the\s+)?(?:safety|safety page|सुरक्षा)$/i.test(normalizedMessage)
      || /^सुरक्षा\s+(?:पेज\s+)?खोलें$/i.test(normalizedMessage)) {
      setTab('safety');
      setMobileMenuOpen(false);
      respondToCommand('Opening the safety page.');
      return;
    }
    if (/^(?:open|show|go to|switch to|take me to)\s+(?:my\s+)?(?:saved places|saved places page|सहेजे गए स्थान)$/i.test(normalizedMessage)
      || /^सहेजे गए स्थान\s+खोलें$/i.test(normalizedMessage)) {
      setTab('saved');
      setMobileMenuOpen(false);
      respondToCommand('Opening your saved places.');
      return;
    }
    if (/^(?:open|show|go to|switch to|take me to)\s+(?:the\s+)?(?:route planner|journey planner|plan a journey|home|यात्रा योजनाकार)$/i.test(normalizedMessage)
      || /^यात्रा\s+योजनाकार\s+खोलें$/i.test(normalizedMessage)) {
      setTab('route');
      setMobileMenuOpen(false);
      respondToCommand('Opening the journey planner.');
      return;
    }

    if (/^(?:what can you do|help|commands|मदद|आप क्या कर सकते हैं)$/i.test(normalizedMessage)) {
      respondToCommand('You can ask me to open pages, plan a route, use your location, change the website language, or manage saved places.');
      return;
    }

    setBusy(true); setError(''); setAiAnswer(''); setStatus('Asking RiderFlow…');
    try {
      const explicitTrip = /\bfrom\b[\s\S]*\bto\b/i.test(message) || /\bbetween\b[\s\S]*\band\b/i.test(message);
      const asksForRoute = explicitTrip || /\b(route|directions?|navigate|journey|trip|commute)\b|how (?:do|can) i get/i.test(message);
      const res = await fetch(`${API}/api/ai/plan`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          message,
          language,
          origin: asksForRoute && !explicitTrip ? (origin || null) : null,
          destination: asksForRoute && !explicitTrip ? (destination || null) : null
        })
      });
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error('The AI service returned an unreadable response. Check the backend and try again.');
      }
      if (!res.ok) {
        throw new Error(typeof data?.detail === 'string' ? data.detail : 'Assistant could not answer.');
      }
      if (!data || typeof data.answer !== 'string' || !data.answer.trim()
        || !['llm', 'ollama'].includes(data.ai_mode)) {
        throw new Error('The AI service returned incomplete or invalid data. Check the backend and try again.');
      }
      setAiAnswer(data.answer);
      setAiMode(data.ai_mode);
      setVoiceMessage(current => current.startsWith('Heard:') ? current.replace(' — asking RiderFlow…', ' — response ready.') : current);
      if (data.origin) {
        setOrigin(data.origin);
        setSelectedOrigin(null);
      }
      if (data.destination) {
        setDestination(data.destination);
        setSelectedDestination(null);
      }
      setShowAssistant(true);
      if (data.can_route) await planRoute(data.origin, data.destination, data.transport_mode === 'walking' ? 'walking' : mode, {origin: null, destination: null});
      else setStatus('Response ready');
    } catch(e) {
      setError(apiErrorMessage(e, 'Cannot reach the AI service. Check that the backend is running.'));
      setVoiceMessage(current => current.startsWith('Heard:') ? current.replace(' — asking RiderFlow…', ' — assistant request failed.') : current);
      setStatus('Needs attention');
    }
    finally { setBusy(false); }
  }

  function voiceSearch() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      const message = 'Voice recognition is not supported in this browser. Open RiderFlow in Chrome or Edge, or type your request.';
      setError(message);
      setVoiceMessage(message);
      setVoiceFailed(true);
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }
    setError('');
    setVoiceMessage('');
    setVoiceFailed(false);
    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = voiceLanguage;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    let finalTranscript = '';
    let submittedTranscript = '';
    rec.onstart = () => {
      setVoiceMessage('');
      setIsListening(true);
      setStatus('Listening — speak now');
    };
    rec.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
      setStatus(current => current === 'Listening — speak now' ? (finalTranscript ? 'Voice request ready' : 'Ready to plan') : current);
    };
    rec.onerror = event => {
      if (submittedTranscript) return;
      const messages = {
        'no-speech': 'No speech detected. Tap the microphone and speak soon after it starts listening.',
        'not-allowed': 'Microphone access is blocked. Allow microphone access for RiderFlow in your browser settings.',
        'service-not-allowed': 'Speech recognition is blocked by this browser. Try the latest Chrome and check its speech-service settings.',
        'audio-capture': 'No microphone was found. Connect or enable a microphone, then try again.',
        'network': !navigator.onLine
          ? 'No internet connection. Reconnect and try voice again.'
          : /Electron|Code\//i.test(navigator.userAgent)
            ? 'This VS Code browser cannot reach its online speech service. Open this site in desktop Chrome or Edge and allow microphone access, or type your request.'
            : 'Your browser could not reach its online speech service. Check your connection or VPN, then retry in Chrome or Edge. You can also type your request.',
        'language-not-supported': 'The selected speech language is unavailable in this browser. Choose another language or type your request.'
      };
      const message = messages[event.error] || `Voice input failed (${event.error || 'unknown error'}). Please try again or type your request.`;
      recognitionRef.current = null;
      setIsListening(false);
      setError(message);
      setVoiceMessage(message);
      setVoiceFailed(true);
      setStatus('Voice input needs attention');
    };
    rec.onresult = event => {
      let interimTranscript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript?.trim();
        if (!transcript) continue;
        if (result.isFinal) finalTranscript = `${finalTranscript} ${transcript}`.trim();
        else interimTranscript = `${interimTranscript} ${transcript}`.trim();
      }
      if (finalTranscript) {
        setPrompt(finalTranscript);
        setVoiceFailed(false);
        if (finalTranscript !== submittedTranscript) {
          submittedTranscript = finalTranscript;
          setVoiceMessage(`Heard: “${finalTranscript}” — asking RiderFlow…`);
          setStatus('Asking RiderFlow…');
          askAI(finalTranscript);
          rec.stop();
        }
      } else if (interimTranscript) {
        setVoiceMessage(`Hearing: ${interimTranscript}`);
      }
    };
    try {
      rec.start();
    } catch (e) {
      recognitionRef.current = null;
      setIsListening(false);
      setStatus('Voice input needs attention');
      setError(e.name === 'InvalidStateError' ? 'Voice recognition is already active. Wait a moment and try again.' : 'Could not start voice recognition. Check browser microphone permission and try again.');
    }
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.rate = 0.96; window.speechSynthesis.speak(u);
  }

  const firstRoute = routeData?.routes?.[0];
  const journeySummary = isValidRouteResponse(routeData)
    && Number.isFinite(routeCalculatedAt)
    && firstRoute.duration_min > 0
    && typeof routeData.origin.name === 'string' && routeData.origin.name.trim()
    && typeof routeData.destination.name === 'string' && routeData.destination.name.trim()
    ? (() => {
      const durationMinutes = Math.round(firstRoute.duration_min);
      const arrival = new Date(routeCalculatedAt + firstRoute.duration_min * 60_000);
      if (!Number.isFinite(arrival.getTime())) return null;
      const locale = language === 'hi' ? 'hi-IN' : 'en-IN';
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      const formattedDuration = hours
        ? `${hours} ${t('hr')}${minutes ? ` ${minutes} ${t('min')}` : ''}`
        : `${durationMinutes} ${t('min')}`;
      return {
        origin: routeData.origin.name,
        destination: routeData.destination.name,
        distance: `${new Intl.NumberFormat(locale, {maximumFractionDigits: 1}).format(firstRoute.distance_km)} ${t('km')}`,
        duration: formattedDuration,
        arrival: new Intl.DateTimeFormat(locale, {dateStyle: 'medium', timeStyle: 'short'}).format(arrival),
        durationLabel: t(routeData.mode === 'walking' ? 'Estimated walking time' : 'Estimated driving time'),
      };
    })()
    : null;
  const mapUrl = routeData
    ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_${routeData.mode === 'walking' ? 'foot' : 'car'}&route=${routeData.origin.lat}%2C${routeData.origin.lon}%3B${routeData.destination.lat}%2C${routeData.destination.lon}`
    : `https://www.openstreetmap.org/export/embed.html?bbox=68.1%2C6.5%2C97.4%2C37.1&layer=mapnik`;

  return <div className="app-shell">
    <header className="site-header">
      <a className="site-brand" href="#" onClick={e=>{e.preventDefault();setTab('route');}} aria-label={t('RiderFlow home')}>
        <span className="site-brand-mark"><Route size={19}/></span><span>riderflow</span>
      </a>
      <button className="mobile-menu-button" aria-label={mobileMenuOpen?'Close navigation':'Open navigation'} aria-expanded={mobileMenuOpen} onClick={()=>setMobileMenuOpen(!mobileMenuOpen)}><Menu size={21}/></button>
      <nav className={`site-nav ${mobileMenuOpen?'open':''}`} aria-label="Main navigation">
        <button className={tab==='route'?'active':''} aria-current={tab==='route'?'page':undefined} onClick={()=>{setTab('route');setMobileMenuOpen(false);}}>{t('Plan a journey')}</button>
        <button className={tab==='safety'?'active':''} aria-current={tab==='safety'?'page':undefined} onClick={()=>{setTab('safety');setMobileMenuOpen(false);}}>{t('Safety')}</button>
        <button className={tab==='saved'?'active':''} aria-current={tab==='saved'?'page':undefined} onClick={()=>{setTab('saved');setMobileMenuOpen(false);}}>{t('Saved places')}</button>
      </nav>
      <div className="site-header-actions"><span className="header-status"><span className="header-status-dot"/>{t(status)}</span><label className="site-language-picker"><span className="sr-only">{t('Website language')}</span><select aria-label={t('Website language')} value={language} onChange={event=>setLanguage(event.target.value)}><option value="en">English</option><option value="hi">हिन्दी</option></select></label><span className="guest-chip"><UserRound size={15}/> {t('Guest')}</span></div>
    </header>
    <main className="main-area">

      {tab==='route' ? <div className="page-content">
        <section className="welcome-row">
          <div><div className="eyebrow"><Sparkles size={14}/> {t('YOUR AI MOBILITY COMPANION')}</div><h1>{t('Move smarter.')}<br/><span>{t('Arrive with confidence.')}</span></h1><p className="hero-copy">{t("Tell us where you're going. We'll help you find your way, with a little more clarity and a lot more confidence.")}</p></div>
          <div className="hero-orbit"><div className="orbit-ring ring-one"/><div className="orbit-ring ring-two"/><div className="orbit-core"><Navigation size={31}/></div><span className="orbit-dot dot-a"/><span className="orbit-dot dot-b"/><span className="orbit-dot dot-c"/></div>
        </section>

        <section className="search-card">
          <div className="search-card-head"><div><div className="section-kicker">{t('START YOUR JOURNEY')}</div><h2>{t('Where to today?')}</h2></div><span className="powered"><Sparkles size={13}/> {t('AI assisted')}</span></div>
          <div className="trip-fields">
            <div className="trip-rail"><span className="rail-origin"/><span className="rail-line"/><span className="rail-destination"/></div>
            <div className="place-input-wrap"><label className="location-field"><span>{t('FROM')}</span><input value={origin} onFocus={()=>setActivePlaceField('origin')} onChange={e=>{setOrigin(e.target.value);setSelectedOrigin(null);setRouteData(null);setError('');}} placeholder={t('City, address, or landmark in India')} autoComplete="off" aria-autocomplete="list" aria-expanded={activePlaceField==='origin'&&placeResults.length>0}/></label>
              {activePlaceField==='origin'&&(placeSearchBusy||placeResults.length>0||placeSearchDone)&&<div className="place-results" role="listbox" aria-label={t('Starting place suggestions')}>{placeSearchBusy&&<div className="place-result-status">{t('Searching places…')}</div>}{placeResults.map((place,index)=><button type="button" role="option" aria-selected="false" className="place-result" key={`${place.lat}-${place.lon}-${index}`} onMouseDown={e=>e.preventDefault()} onClick={()=>selectPlace('origin',place)}>{place.name}</button>)}{placeSearchDone&&!placeSearchBusy&&placeResults.length===0&&<div className="place-result-status">{t('No matches. Add a city or state to refine your search.')}</div>}</div>}
            </div>
            <button className="swap-button" title={t('Swap locations')} onClick={()=>{setOrigin(destination);setDestination(origin);setSelectedOrigin(selectedDestination);setSelectedDestination(selectedOrigin);setActivePlaceField('');setPlaceResults([]);setPlaceSearchDone(false);setError('');setRouteData(null);}}><ArrowLeftRight size={17}/></button>
            <div className="place-input-wrap"><label className="location-field"><span>{t('TO')}</span><input value={destination} onFocus={()=>setActivePlaceField('destination')} onChange={e=>{setDestination(e.target.value);setSelectedDestination(null);setRouteData(null);setError('');}} placeholder={t('City, address, or landmark in India')} autoComplete="off" aria-autocomplete="list" aria-expanded={activePlaceField==='destination'&&placeResults.length>0}/></label>
              {activePlaceField==='destination'&&(placeSearchBusy||placeResults.length>0||placeSearchDone)&&<div className="place-results" role="listbox" aria-label={t('Destination suggestions')}>{placeSearchBusy&&<div className="place-result-status">{t('Searching places…')}</div>}{placeResults.map((place,index)=><button type="button" role="option" aria-selected="false" className="place-result" key={`${place.lat}-${place.lon}-${index}`} onMouseDown={e=>e.preventDefault()} onClick={()=>selectPlace('destination',place)}>{place.name}</button>)}{placeSearchDone&&!placeSearchBusy&&placeResults.length===0&&<div className="place-result-status">{t('No matches. Add a city or state to refine your search.')}</div>}</div>}
            </div>
          </div>
          {error&&<div className="error-banner"><X size={17}/><span>{t(error)}</span><button onClick={()=>setError('')}>{t('Dismiss')}</button></div>}
          <div className="search-bottom"><div className="trip-options"><button className="location-button" disabled={locationBusy} onClick={useCurrentLocation}><LocateFixed size={15}/>{locationBusy?t('Locating…'):t('Use my location')}</button></div><button className="primary-button" disabled={busy} onClick={()=>planRoute()}>{busy?<span className="spinner"/>:<Search size={17}/>} {t('Find my route')} <ArrowRight size={16}/></button></div>
        </section>

        {journeySummary && <section className="journey-summary" aria-labelledby="journey-summary-title">
          <div className="journey-summary-heading">
            <span className="journey-summary-icon"><Route size={19}/></span>
            <div><div className="section-kicker">{t('YOUR JOURNEY')}</div><h2 id="journey-summary-title">{t('Journey summary')}</h2></div>
            <span className="journey-summary-estimate"><Clock3 size={14}/>{t('Estimated arrival time')}</span>
          </div>
          <div className="journey-summary-body">
            <div className="journey-summary-endpoints">
              <div className="journey-summary-place"><span className="endpoint-dot green"/><div><small>{t('STARTING FROM')}</small><strong>{journeySummary.origin}</strong></div></div>
              <ArrowRight className="journey-summary-arrow" size={17}/>
              <div className="journey-summary-place"><span className="endpoint-dot orange"/><div><small>{t('DESTINATION')}</small><strong>{journeySummary.destination}</strong></div></div>
            </div>
            <div className="journey-summary-stats">
              <div className="journey-summary-stat"><span><Route size={15}/>{t('Route distance')}</span><strong>{journeySummary.distance}</strong></div>
              <div className="journey-summary-stat"><span><Clock3 size={15}/>{journeySummary.durationLabel}</span><strong>{journeySummary.duration}</strong></div>
              <div className="journey-summary-stat journey-summary-arrival"><span><Navigation size={15}/>{t('Estimated arrival time')}</span><strong>{journeySummary.arrival}</strong></div>
            </div>
          </div>
          <p className="journey-summary-note">{t('Based on the route estimate and calculation time; actual arrival may vary.')}</p>
        </section>}

        <section className="ai-search">
          <div className="ai-avatar"><Bot size={21}/><span/></div>
          <div className="ai-search-main"><div className="ai-title-row"><div><strong>{t('Ask RiderFlow')}</strong><span className="ai-badge">{t(aiMode==='llm'?'CONNECTED AI':aiMode==='ollama'?'LOCAL AI':'INDIA TRAVEL GUIDE')}</span></div><span className="ai-subtitle">{t('Ask travel questions or try “open Safety”, “change website language to Hindi”, or “save Home at Connaught Place”.')}</span></div>
            <div className="ai-input-row"><input value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&askAI()} placeholder={t('e.g. Find a route from Delhi to Jaipur')}/><select className="voice-language" value={voiceLanguage} onChange={e=>setVoiceLanguage(e.target.value)} aria-label={t('Speech recognition language')}><option value="en-IN">English</option><option value="hi-IN">हिन्दी</option><option value="bn-IN">বাংলা</option><option value="mr-IN">मराठी</option><option value="ta-IN">தமிழ்</option><option value="te-IN">తెలుగు</option><option value="gu-IN">ગુજરાતી</option><option value="kn-IN">ಕನ್ನಡ</option><option value="ml-IN">മലയാളം</option><option value="pa-IN">ਪੰਜਾਬੀ</option></select><button className={`mic-button ${isListening?'listening':''}`} title={t(isListening?'Stop listening':'Speak your request')} onClick={voiceSearch} aria-label={t(isListening?'Stop voice search':'Voice search')} aria-pressed={isListening}><Mic size={17}/></button><button className="ai-send" disabled={busy} onClick={()=>askAI()}>{busy?t('Thinking…'):<><Sparkles size={16}/> {t('Ask AI')}</>}</button></div>
            {(isListening||voiceMessage)&&<div className={`voice-status ${voiceFailed?'error':''}`} role="status">{!voiceFailed&&<span/>}{isListening?(voiceMessage||t('Listening — speak now. Tap the microphone to stop.')):voiceMessage}</div>}
            <div className="suggestions"><span>{t('TRY ASKING')}</span>{['How do I get from Delhi to Jaipur?','Bus options from Pune to Goa','Train from Mumbai to Bengaluru','Flights from Chennai to Kolkata','Bike options near me','How can I travel more safely?'].map(s=><button key={s} onClick={()=>{setPrompt(t(s));askAI(t(s))}}>{t(s)}</button>)}</div>
            {aiAnswer&&<div className="ai-answer"><div className="answer-heading"><Sparkles size={15}/> {t('RiderFlow says')} <button onClick={()=>speak(aiAnswer)} title={t('Read answer aloud')}><Volume2 size={15}/></button></div><p>{aiAnswer}</p>{pendingCommand&&<div className="command-confirmation" role="group" aria-label={t('Confirm or cancel')}><button className="primary-button" onClick={()=>askAI('yes')}>{t('Confirm')}</button><button className="outline-button" onClick={()=>askAI('no')}>{t('Cancel')}</button></div>}</div>}
          </div>
        </section>

        {routeData&&<section className="transit-options">
          <div className="section-heading">
            <div><div className="section-kicker">{t('TRAVEL COMPARISON · INDIA')}</div><h2>{t('Transport comparisons')}</h2></div>
            <span className="transit-live-label"><span/>{t(transitLoading?'Checking transit options…':transitError||transitData?.bus.status==='error'||transitData?.train.status==='error'?'Transit provider error':transitData?.bus.status==='available'||transitData?.train.status==='available'?'Transit provider results':transitData?.bus.status==='no_data'&&transitData?.train.status==='no_data'?'No transit itinerary returned':transitData?.bus.status==='not_configured'?'Transit data not connected':'Transit provider unavailable')}</span>
          </div>
          <div className="transit-options-grid demo-options-grid">
            {[...getTransitTravelOptions(routeData,transitData,transitLoading,transitError),...getDemoTravelOptions(routeData)].map(option=>{
              const Icon = option.icon;
              return <article className="transit-card demo-option-card" key={option.id}>
                <div className="transit-card-heading"><span className={`transit-icon ${option.id==='bus'?'bus-icon':option.id==='train'?'train-icon':option.id==='flight'?'flight-icon':'rental-icon'}`}><Icon size={19}/></span><div><strong>{t(option.name)}</strong><small>{t(option.source || 'Estimated demo value — not a quote')}</small></div></div>
                <div className="demo-estimate">{option.estimate}</div>
                {option.detail&&<p>{t(option.detail)}</p>}
                {option.fareMethod&&<p>{t(option.fareMethod)}</p>}
                {option.fareDisclaimer&&<p className="demo-option-note">{t(option.fareDisclaimer)}</p>}
                {option.departure&&option.arrival&&<p><strong>{t('Provider schedule (UTC)')}</strong><br/>{t('Departure')}: {formatProviderTime(option.departure)} · {t('Arrival')}: {formatProviderTime(option.arrival)}</p>}
                {option.note&&<p className={`demo-option-note ${option.noteTone}`}>{t(option.note)}</p>}
                <a className="demo-option-link" href={option.link} target="_blank" rel="noreferrer">{t(option.action)} <ArrowRight size={13}/></a>
              </article>;
            })}
          </div>
          <p className="transit-disclaimer">{t('Transit itineraries are returned by Google Routes API only when configured and available for this area. Schedules may change and are not guaranteed live arrivals. Fare appears only when the provider returns it. Flight and rental values are synthetic demo estimates, not quotes or availability.')}</p>
        </section>}

        <div className="content-grid">
          <section className="route-results">
            <div className="section-heading"><div><div className="section-kicker">{t('YOUR JOURNEY')}</div><h2>{t(routeData?'Route options':'Ready when you are')}</h2></div>{routeData&&<span className="results-count">{routeData.routes.length} {t(routeData.routes.length===1?'option':'options')}</span>}</div>
            {!routeData ? (
              <div className="empty-state">
                <div className="empty-icon"><MapPin size={24}/></div>
                <h3>{t('Your next journey starts here')}</h3>
                <p>{t('Enter your destination above or ask RiderFlow in your own words to get started.')}</p>
                <div className="mini-stats">
                  <div><Clock3 size={16}/><span>{t('Time estimates')}</span></div>
                  <div><MapPin size={16}/><span>{t('Place search')}</span></div>
                  <div><ShieldCheck size={16}/><span>{t('Safety first')}</span></div>
                </div>
              </div>
            ) : (
              <div className="route-list">
                {routeData.routes.map((route, index) => (
                  <div className={`route-option ${index === 0 ? 'recommended' : ''}`} key={route.id}>
                    <div className="route-icon">{index === 0 ? <Zap size={19}/> : <Route size={19}/>}</div>
                    <div className="route-info">
                      <div className="route-title-row">
                        <strong>{index === 0 ? t('Recommended route') : `${t('Alternative')} ${index}`}</strong>
                        {index === 0 && <span className="best-tag">{t('BEST MATCH')}</span>}
                      </div>
                      <div className="route-meta">
                        <span><Clock3 size={14}/>{route.duration_min} {t('min')}</span>
                        <span><Route size={14}/>{route.distance_km} {t('km')}</span>
                      </div>
                      <p>{t(route.summary)}</p>
                    </div>
                    <button className="outline-button" onClick={() => window.open(mapUrl, '_blank', 'noopener,noreferrer')}>
                      {t('Open map')} <ArrowRight size={14}/>
                    </button>
                  </div>
                ))}
                <div className="route-notice"><span className="notice-dot"/>{t(routeData.notice)}</div>
                <div className="journey-endpoints">
                  <div><span className="endpoint-dot green"/><div><small>{t('STARTING FROM')}</small><strong>{routeData.origin.name}</strong></div></div>
                  <ArrowDown size={16}/>
                  <div><span className="endpoint-dot orange"/><div><small>{t('DESTINATION')}</small><strong>{routeData.destination.name}</strong></div></div>
                </div>
                <button className="outline-button save-journey-button" onClick={saveJourney} disabled={journeyAlreadySaved}>
                  <Star size={15}/>{t(journeyAlreadySaved ? 'Journey saved' : 'Save Journey')}
                </button>
              </div>
            )}
            {routeData && <article className="journey-alert-card">
              <div className="journey-alert-heading">
                <span className="journey-alert-icon"><Bell size={17}/></span>
                <div><strong>{t('Enable journey alerts')}</strong><p>{t('Demo alerts are simulated only. No live bus location or service data is used.')}</p></div>
              </div>
              {!demoAlertsEnabled
                ? <button className="outline-button" onClick={enableDemoAlerts}>{t('Enable demo alerts')}</button>
                : <div className="journey-alert-demo">
                  <span className="demo-mode-badge">{t('DEMO MODE')}</span>
                  <strong>{t('Sample bus stops remaining')}: {demoStopsRemaining}</strong>
                  <div className="journey-alert-voice">
                    <span>{t('Voice alerts')}</span>
                    <button
                      className="outline-button"
                      type="button"
                      onClick={toggleDemoVoice}
                      disabled={!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)}
                      aria-pressed={demoVoiceEnabled}
                    >{t(demoVoiceEnabled ? 'Voice on' : 'Voice off')}</button>
                    {(!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window))
                      && <span className="voice-unavailable">{t('Speech output is not supported in this browser.')}</span>}
                  </div>
                  <div className="journey-alert-controls">
                    <button className="primary-button" onClick={advanceDemoStop} disabled={!demoAlertsRunning}>{t('Advance to next sample stop')}</button>
                    <button className="outline-button" onClick={()=>setDemoAlertsRunning(!demoAlertsRunning)} disabled={demoStopsRemaining === 0}>{t(demoAlertsRunning ? 'Stop simulation' : 'Resume simulation')}</button>
                    <button className="outline-button" onClick={resetDemoSimulation}>{t('Reset simulation')}</button>
                  </div>
                  {demoAlertMessage&&<div className={`journey-alert-message ${demoStopsRemaining === 1 ? 'destination-next' : demoStopsRemaining === 0 ? 'destination-arrived' : ''}`} role="status" aria-live="polite"><span className="demo-mode-badge">{t('DEMO MODE')}</span><strong>{t(demoAlertMessage)}</strong></div>}
                </div>}
            </article>}
          </section>
          <section className="map-panel"><div className="map-panel-head"><div><div className="section-kicker">{t('EXPLORE YOUR WORLD')}</div><h2>{t('Journey map')}</h2></div><button className="map-expand" aria-label={t('Open map')} onClick={()=>window.open(mapUrl,'_blank','noopener,noreferrer')}><Navigation size={15}/></button></div>
            <div className="map-visual"><JourneyMap routeData={routeData} language={language}/><div className="map-caption"><span className="map-live-dot"/> OpenStreetMap <span>•</span> {t(routeData?'Red: recommended route':'India overview')}</div></div>
            <div className="map-bottom"><div className="map-bottom-icon"><LocateFixed size={17}/></div><div><strong>{t(routeData?'Your destination is pinned':'A map to get you started')}</strong><p>{t(routeData?'Open the map to explore your route and nearby streets.':'Plan a journey to see your destination on the map.')}</p></div></div>
          </section>
        </div>
        <section className="feature-overview">
          <div className="section-heading"><div><div className="section-kicker">{t('RIDERFLOW FEATURES')}</div><h2>{t('Travel tools, all in one place')}</h2></div></div>
          <div className="feature-overview-grid">
            <article className="overview-card"><span className="overview-icon violet"><Bot size={18}/></span><div><strong>{t('AI travel assistant')}</strong><p>{t('Ask by text or voice for journey planning and practical travel guidance.')}</p><span className="feature-status"><Check size={13}/> {t('Available')}</span></div></article>
            <article className="overview-card"><span className="overview-icon blue"><Route size={18}/></span><div><strong>{t('Route planning & map')}</strong><p>{t('Compare available road or walking estimates and explore the map.')}</p><span className="feature-status"><Check size={13}/> {t('Available')}</span></div></article>
            <article className="overview-card"><span className="overview-icon mint"><LocateFixed size={18}/></span><div><strong>{t('GPS location')}</strong><p>{t('Use your device location as a trip starting point when you grant permission.')}</p><span className="feature-status"><Check size={13}/> {t('Browser permission')}</span></div></article>
            <article className="overview-card"><span className="overview-icon peach"><ShieldCheck size={18}/></span><div><strong>{t('Passenger safety')}</strong><p>{t('Open Safety for journey guidance and a message to share with a trusted contact.')}</p><span className="feature-status"><Check size={13}/> {t('Available')}</span></div></article>
            <article className="overview-card"><span className="overview-icon gold"><Star size={18}/></span><div><strong>{t('Saved places')}</strong><p>{t('Keep frequently used destinations in this browser for quick trip planning.')}</p><span className="feature-status"><Check size={13}/> {t('Available')}</span></div></article>
            <article className="overview-card planned-card"><span className="overview-icon slate"><Bell size={18}/></span><div><strong>{t('Deviation alerts')}</strong><p>{t('Automatic route monitoring and contact alerts are planned, not active yet.')}</p><span className="feature-status planned-status">{t('Planned')}</span></div></article>
          </div>
          <div className="coming-next"><strong>{t('Coming next')}</strong><span>{t('Live transit tracking')}</span><span>{t('Schedules, fares & interchanges')}</span><span>{t('Time, distance & cost comparisons')}</span><span>{t('Multilingual AI assistance')}</span><span>{t('Live sharing & SOS')}</span><span>{t('Personalized suggestions')}</span><span>{t('Traffic-aware routes')}</span></div>
        </section>
        <footer className="footer"><span>© 2026 RiderFlow</span><span><ShieldCheck size={14}/> {t('Built for safer, smarter journeys')}</span><span>{t('Maps © OpenStreetMap contributors')}</span></footer>
      </div> : tab==='safety' ? <div className="page-content secondary-page">
        <div className="eyebrow"><ShieldCheck size={14}/> {t('YOUR WELLBEING MATTERS')}</div>
        <h1>{t('Safety, built into')}<br/><span>{t('every journey.')}</span></h1>
        <p className="hero-copy">{t('Small steps can make every trip feel more predictable. These tools are a prototype, not an emergency service.')}</p>
        <div className="safety-grid">
          <div className="feature-card"><div className="feature-icon mint"><LocateFixed/></div><h3>{t('Journey awareness')}</h3><p>{t('Use the trip planner’s location button when needed. Location access is requested only after you choose it.')}</p><span className="feature-status"><Check size={14}/> {t('Guidance available')}</span></div>
          <div className="feature-card"><div className="feature-icon lavender"><ShieldCheck/></div><h3>{t('Trusted contacts')}</h3><p>{t('Prepare a journey message and share it with someone you trust using WhatsApp.')}</p><button className="outline-button" onClick={()=>{const msg=encodeURIComponent(`${t('My planned journey')}: ${origin} ${t('to')} ${destination}. ${t("I'll update you when I arrive.")}`);window.open(`https://wa.me/?text=${msg}`,'_blank','noopener,noreferrer')}}>{t('Prepare share message')} <ArrowRight size={14}/></button></div>
          <div className="feature-card"><div className="feature-icon peach"><Bell/></div><h3>{t('Arrival check-in')}</h3><p>{t('Set a reminder on your phone to let your trusted contact know when you arrive.')}</p><span className="feature-status muted-status">{t('Manual check-in')}</span></div>
          <div className="feature-card"><div className="feature-icon lavender"><Navigation/></div><h3>{t('Route deviation alerts')}</h3><p>{t('Automatic route monitoring and alerts to you or trusted contacts are planned, but are not active yet.')}</p><span className="feature-status planned-status">{t('Planned')}</span></div>
        </div>
        <article className="feature-card missed-stop-card">
          <div className="feature-icon mint"><Route/></div>
          <h3>{t('Missed my stop?')}</h3>
          <p>{t('Move to a safe public place and ask transit staff for help. If you want to continue to your planned destination, RiderFlow can calculate a new road route from your current location. This is not live transit guidance.')}</p>
          <button className="outline-button" onClick={recoverMissedStop}>{t('Find a route from my current location')} <ArrowRight size={14}/></button>
          {recoveryMessage&&<p className="recovery-status" role="status">{t(recoveryMessage)}</p>}
        </article>
        <div className="safety-note"><ShieldCheck size={20}/><div><strong>{t('Important safety note')}</strong><p>{t("This prototype does not dispatch emergency services or automatically send live alerts. If you're in immediate danger, contact local emergency services directly.")}</p></div></div>
      </div>
      : <div className="page-content secondary-page">
        <div className="eyebrow"><Star size={14}/> {t('YOUR SHORTLIST')}</div><h1>{t('Your places,')}<br/><span>{t('all in one place.')}</span></h1>
        <p className="hero-copy">{t('Save your regular destinations in this browser and add them to a trip whenever you need them.')}</p>
        <form className="save-place-form" onSubmit={e=>{e.preventDefault();savePlace();}}>
          <label>{t('Place name')}<input value={savedPlaceName} onChange={e=>setSavedPlaceName(e.target.value)} placeholder={t('e.g. Home')}/></label>
          <label>{t('Address or landmark')}<input value={savedPlaceAddress} onChange={e=>setSavedPlaceAddress(e.target.value)} placeholder={t('e.g. Connaught Place, New Delhi')}/></label>
          <button className="primary-button" type="submit"><Star size={16}/> {t('Save place')}</button>
        </form>
        {error&&<div className="saved-page-error" role="alert">{t(error)}</div>}
        <section className="saved-journeys-section" aria-labelledby="saved-journeys-title">
          <h2 id="saved-journeys-title">{t('Saved journeys')}</h2>
          {savedJourneys.length
            ? <div className="saved-grid">{savedJourneys.map(journey=><div className="saved-place-card" key={journey.id}>
              <button className="saved-place" aria-label={`${t('Select saved journey')}: ${journey.origin.name} to ${journey.destination.name}`} onClick={()=>selectSavedJourney(journey)}>
                <span className="saved-place-icon"><Route/></span><span><strong>{journey.origin.name} → {journey.destination.name}</strong><small>{t(journey.mode === 'walking' ? 'Walking' : 'Driving')}</small></span><ArrowRight size={16}/>
              </button>
              <button className="remove-place" onClick={()=>removeSavedJourney(journey.id)} aria-label={`${t('Remove')} ${journey.origin.name} to ${journey.destination.name}`}>{t('Remove')}</button>
            </div>)}</div>
            : <div className="saved-empty"><Route size={22}/><strong>{t('Saved journeys')}</strong><span>{t('Saved journeys will appear here.')}</span></div>}
        </section>
        {savedPlaces.length ? <div className="saved-grid">{savedPlaces.map(place=><div className="saved-place-card" key={place.id}><button className="saved-place" onClick={()=>{setDestination(place.address);setTab('route');}}><span className="saved-place-icon"><MapPin/></span><span><strong>{place.name}</strong><small>{place.address}</small></span><ArrowRight size={16}/></button><button className="remove-place" onClick={()=>removeSavedPlace(place.id)} aria-label={`${t('Remove')} ${place.name}`}>{t('Remove')}</button></div>)}</div> : <div className="saved-empty"><MapPin size={22}/><strong>{t('No saved places yet')}</strong><span>{t('Add home, college, or another regular destination above.')}</span></div>}
      </div>}
      {tab !== 'route' && <section className="ai-command-panel" aria-label={t('Ask RiderFlow')}>
        <div className="ai-command-panel-title"><Bot size={18}/><strong>{t('Ask RiderFlow')}</strong><span>{t('Ask travel questions or try “open Safety”, “change website language to Hindi”, or “save Home at Connaught Place”.')}</span></div>
        <div className="ai-input-row">
          <input value={prompt} onChange={event=>setPrompt(event.target.value)} onKeyDown={event=>event.key==='Enter'&&askAI()} placeholder={t('e.g. Find a route from Delhi to Jaipur')}/>
          <select className="voice-language" value={voiceLanguage} onChange={event=>setVoiceLanguage(event.target.value)} aria-label={t('Speech recognition language')}>
            <option value="en-IN">English</option><option value="hi-IN">हिन्दी</option><option value="bn-IN">বাংলা</option><option value="mr-IN">मराठी</option><option value="ta-IN">தமிழ்</option><option value="te-IN">తెలుగు</option><option value="gu-IN">ગુજરાતી</option><option value="kn-IN">ಕನ್ನಡ</option><option value="ml-IN">മലയാളം</option><option value="pa-IN">ਪੰਜਾਬੀ</option>
          </select>
          <button className={`mic-button ${isListening?'listening':''}`} title={t(isListening?'Stop listening':'Speak your request')} onClick={voiceSearch} aria-label={t(isListening?'Stop voice search':'Voice search')} aria-pressed={isListening}><Mic size={17}/></button>
          <button className="ai-send" disabled={busy} onClick={()=>askAI()}>{busy?t('Thinking…'):<><Sparkles size={16}/> {t('Ask AI')}</>}</button>
        </div>
        {error&&<div className="error-banner" role="alert"><X size={17}/><span>{t(error)}</span><button onClick={()=>setError('')}>{t('Dismiss')}</button></div>}
        {aiAnswer&&<div className="ai-answer"><div className="answer-heading"><Sparkles size={15}/>{t('RiderFlow says')}</div><p>{aiAnswer}</p>{pendingCommand&&<div className="command-confirmation" role="group" aria-label={t('Confirm or cancel')}><button className="primary-button" onClick={()=>askAI('yes')}>{t('Confirm')}</button><button className="outline-button" onClick={()=>askAI('no')}>{t('Cancel')}</button></div>}</div>}
      </section>}
    </main>
    {showAssistant&&<button className="floating-close" onClick={()=>setShowAssistant(false)} aria-label={t('Close assistant answer')}><X size={18}/></button>}
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
