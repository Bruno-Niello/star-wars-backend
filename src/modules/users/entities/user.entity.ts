import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text", { unique: true })
  email: string;

  @Column("text")
  password: string;

  @Column("text")
  name: string;

  @Column({ type: "enum", enum: ["admin", "user"], default: "user" })
  role: "admin" | "user";

  @CreateDateColumn()
  created_at: Date;
}
