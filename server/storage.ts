import { users, type User, type InsertUser } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  findOrCreateUserFromGoogle(profile: any): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const now = new Date();
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email || null,
      sso_type: insertUser.sso_type || null,
      sso_credentials: insertUser.sso_credentials || null,
      profile_picture: insertUser.profile_picture || null,
      display_name: insertUser.display_name || null,
      last_login: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = await this.getUser(id);
    if (!existingUser) return undefined;

    const updatedUser: User = {
      ...existingUser,
    };
    
    // Cập nhật các trường cụ thể từ updates
    if (updates.username !== undefined) updatedUser.username = updates.username;
    if (updates.password !== undefined) updatedUser.password = updates.password;
    if (updates.email !== undefined) updatedUser.email = updates.email;
    if (updates.sso_type !== undefined) updatedUser.sso_type = updates.sso_type;
    if (updates.sso_credentials !== undefined) updatedUser.sso_credentials = updates.sso_credentials;
    if (updates.profile_picture !== undefined) updatedUser.profile_picture = updates.profile_picture;
    if (updates.display_name !== undefined) updatedUser.display_name = updates.display_name;
    
    // Cập nhật thời gian đăng nhập gần nhất
    updatedUser.last_login = new Date();

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async findOrCreateUserFromGoogle(profile: any): Promise<User> {
    // Lấy email từ profile Google
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new Error('Google profile không có email');
    }
    
    // Tìm user với email này
    let user = await this.getUserByEmail(email);

    if (user) {
      // Cập nhật thông tin người dùng nếu đã tồn tại
      const updateFields: Partial<InsertUser> = {
        sso_credentials: profile.id,
        sso_type: 'google'
      };
      
      // Thêm các trường tùy chọn nếu có
      if (profile.photos?.[0]?.value) {
        updateFields.profile_picture = profile.photos[0].value;
      }
      
      if (profile.displayName) {
        updateFields.display_name = profile.displayName;
      }
      
      user = await this.updateUser(user.id, updateFields) as User;
    } else {
      // Tạo người dùng mới nếu chưa tồn tại
      const randomPassword = Math.random().toString(36).slice(-10);
      const newUser: InsertUser = {
        username: email,
        password: randomPassword, // Mật khẩu ngẫu nhiên vì đăng nhập qua Google
        email: email,
        sso_type: 'google',
        sso_credentials: profile.id
      };
      
      // Thêm các trường tùy chọn nếu có
      if (profile.photos?.[0]?.value) {
        newUser.profile_picture = profile.photos[0].value;
      }
      
      if (profile.displayName) {
        newUser.display_name = profile.displayName;
      }
      
      user = await this.createUser(newUser);
    }

    return user;
  }
}

export const storage = new MemStorage();
