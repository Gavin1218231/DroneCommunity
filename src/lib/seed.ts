import { getDb } from './db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

let seeded = false;

export function seedDatabase() {
  if (seeded) return;
  seeded = true;

  const db = getDb();

  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (existingUsers.count > 0) return;

  const users = [
    {
      id: uuidv4(),
      username: 'skyhawk_mike',
      email: 'mike@example.com',
      password_hash: bcrypt.hashSync('password123', 10),
      display_name: 'Mike Reynolds',
      bio: 'Professional drone photographer specializing in landscape and real estate aerial shots. DJI Mavic 3 Pro enthusiast.',
      avatar_url: '',
      drone_setup: 'DJI Mavic 3 Pro, DJI Mini 4 Pro',
      location: 'Denver, CO',
    },
    {
      id: uuidv4(),
      username: 'aerial_anna',
      email: 'anna@example.com',
      password_hash: bcrypt.hashSync('password123', 10),
      display_name: 'Anna Chen',
      bio: 'FPV racing pilot and freestyle enthusiast. Building custom quads since 2019. Part 107 certified.',
      avatar_url: '',
      drone_setup: 'Custom 5" FPV Quad, DJI Avata 2',
      location: 'Austin, TX',
    },
    {
      id: uuidv4(),
      username: 'dronelife_jay',
      email: 'jay@example.com',
      password_hash: bcrypt.hashSync('password123', 10),
      display_name: 'Jay Patel',
      bio: 'Drone mapping and surveying professional. Love exploring new tech in the UAV space.',
      avatar_url: '',
      drone_setup: 'DJI Matrice 350 RTK, Autel EVO II Pro',
      location: 'San Francisco, CA',
    },
    {
      id: uuidv4(),
      username: 'wingwoman_sam',
      email: 'sam@example.com',
      password_hash: bcrypt.hashSync('password123', 10),
      display_name: 'Samantha Brooks',
      bio: 'Nature videographer using drones to capture wildlife from unique perspectives. Conservation advocate.',
      avatar_url: '',
      drone_setup: 'DJI Air 3, Skydio 2+',
      location: 'Portland, OR',
    },
  ];

  const insertUser = db.prepare(
    'INSERT INTO users (id, username, email, password_hash, display_name, bio, avatar_url, drone_setup, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const insertPost = db.prepare(
    'INSERT INTO posts (id, user_id, content, media_url, media_type, post_type, tags, likes_count, comments_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const insertComment = db.prepare(
    'INSERT INTO comments (id, post_id, user_id, content) VALUES (?, ?, ?, ?)'
  );

  for (const user of users) {
    insertUser.run(user.id, user.username, user.email, user.password_hash, user.display_name, user.bio, user.avatar_url, user.drone_setup, user.location);
  }

  const posts = [
    {
      id: uuidv4(),
      user_id: users[0].id,
      content: 'Just captured this incredible sunset over the Rocky Mountains with my Mavic 3 Pro! The Hasselblad camera really shines during golden hour. Shot in D-Log M and graded in DaVinci Resolve. 🏔️',
      media_url: '',
      media_type: '',
      post_type: 'photo',
      tags: 'landscape,sunset,mountains,dji,mavic3pro',
      likes_count: 24,
      comments_count: 2,
    },
    {
      id: uuidv4(),
      user_id: users[1].id,
      content: 'New FPV build complete! Running a T-Motor F7 stack with 2306.5 motors. First flight was buttery smooth. Tune is almost perfect right out of Betaflight 4.5. Who else is building this season?',
      media_url: '',
      media_type: '',
      post_type: 'general',
      tags: 'fpv,build,betaflight,custom,racing',
      likes_count: 18,
      comments_count: 2,
    },
    {
      id: uuidv4(),
      user_id: users[2].id,
      content: 'Completed a 500-acre agricultural survey today using the Matrice 350 RTK. Processed the data through DJI Terra and the orthomosaic came out crystal clear. The RTK accuracy is a game changer for precision agriculture mapping.',
      media_url: '',
      media_type: '',
      post_type: 'general',
      tags: 'mapping,survey,agriculture,dji,matrice',
      likes_count: 31,
      comments_count: 2,
    },
    {
      id: uuidv4(),
      user_id: users[3].id,
      content: 'Spent the morning filming a bald eagle nest from a safe distance with the Skydio 2+. The autonomous tracking is incredible for wildlife work — I can keep a respectful distance while getting smooth cinematic shots. Always remember to follow local wildlife regulations!',
      media_url: '',
      media_type: '',
      post_type: 'video',
      tags: 'wildlife,nature,eagle,skydio,conservation',
      likes_count: 45,
      comments_count: 2,
    },
    {
      id: uuidv4(),
      user_id: users[0].id,
      content: 'Pro tip for real estate drone photography: Always shoot during the \"blue hour\" just after sunset for that premium look. The warm interior lights contrasting with the blue sky creates an incredibly dramatic and professional image. What are your go-to real estate shooting tips?',
      media_url: '',
      media_type: '',
      post_type: 'general',
      tags: 'realestate,tips,photography,bluehour',
      likes_count: 37,
      comments_count: 2,
    },
    {
      id: uuidv4(),
      user_id: users[1].id,
      content: 'Just got my Part 107 renewal approved! Remember, it is now an online recurrent training instead of a test. Much simpler process. If yours is coming up, dont stress — the training modules are straightforward and cover the latest airspace updates.',
      media_url: '',
      media_type: '',
      post_type: 'general',
      tags: 'part107,faa,certification,tips',
      likes_count: 52,
      comments_count: 2,
    },
  ];

  const comments = [
    { post_idx: 0, user_idx: 1, content: 'Stunning shot! The colors are incredible. What ND filter were you using?' },
    { post_idx: 0, user_idx: 2, content: 'The Hasselblad sensor on the Mavic 3 Pro is unreal. Great work!' },
    { post_idx: 1, user_idx: 0, content: 'Nice build! What props are you running? I found the HQProp 5.1x3.1x3 work great with those motors.' },
    { post_idx: 1, user_idx: 3, content: 'Betaflight 4.5 defaults are so good now. Happy flying!' },
    { post_idx: 2, user_idx: 3, content: 'How long did the 500-acre survey take? I am looking into getting into mapping work.' },
    { post_idx: 2, user_idx: 0, content: 'The RTK module is worth every penny for survey work. Great results!' },
    { post_idx: 3, user_idx: 2, content: 'Beautiful work Sam! Its great to see drones being used for conservation.' },
    { post_idx: 3, user_idx: 1, content: 'The Skydio tracking is so reliable. Perfect tool for wildlife documentation.' },
    { post_idx: 4, user_idx: 3, content: 'Blue hour is my favorite time too! I also recommend bracketing exposures for HDR.' },
    { post_idx: 4, user_idx: 2, content: 'Great tip! I always tell my clients twilight shoots are worth the extra cost.' },
    { post_idx: 5, user_idx: 0, content: 'Thanks for the heads up! Mine is due next month. Good to know it is easier now.' },
    { post_idx: 5, user_idx: 3, content: 'The online recurrent training is so much better than the old testing center process.' },
  ];

  for (const post of posts) {
    insertPost.run(post.id, post.user_id, post.content, post.media_url, post.media_type, post.post_type, post.tags, post.likes_count, post.comments_count);
  }

  for (const comment of comments) {
    insertComment.run(uuidv4(), posts[comment.post_idx].id, users[comment.user_idx].id, comment.content);
  }

  // Create a conversation between users
  const convId = uuidv4();
  db.prepare('INSERT INTO conversations (id) VALUES (?)').run(convId);
  db.prepare('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)').run(convId, users[0].id);
  db.prepare('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)').run(convId, users[1].id);

  const insertMsg = db.prepare('INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, ?)');
  insertMsg.run(uuidv4(), convId, users[1].id, 'Hey Mike! I saw your sunset shot — absolutely incredible. What altitude were you at?');
  insertMsg.run(uuidv4(), convId, users[0].id, 'Thanks Anna! I was at about 300ft AGL. The air was super clear that evening which helped a lot.');
  insertMsg.run(uuidv4(), convId, users[1].id, 'Nice! I need to plan a trip out to Colorado sometime. The scenery is unreal for aerial photography.');

  // Create AI assistant user
  const aiUserId = 'ai-drone-assistant';
  insertUser.run(aiUserId, 'drone_ai', 'ai@dronecommunity.local', bcrypt.hashSync('not-a-real-password', 10), 'SkyBot AI', 'Your AI drone assistant. Ask me anything about drones, regulations, camera settings, and flight planning!', '', 'All the drones!', 'The Cloud');
}
