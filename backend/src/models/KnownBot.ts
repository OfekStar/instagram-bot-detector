import "reflect-metadata";
import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  UpdatedAt,
} from "sequelize-typescript";
import { FlaggedField, Reason } from "../types";

@Table({ tableName: "known_bots", timestamps: true })
export class KnownBot extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: string;

  @Column(DataType.STRING)
  declare username: string;

  @Column(DataType.STRING)
  declare displayName: string;

  @Column(DataType.INTEGER)
  declare botScore: number;

  @Column(DataType.BOOLEAN)
  declare isKnownBot: boolean;

  @Column(DataType.INTEGER)
  declare followerCount: number;

  @Column(DataType.INTEGER)
  declare followingCount: number;

  @Column(DataType.INTEGER)
  declare postCount: number;

  @Column(DataType.STRING)
  declare firstPostDate: string;

  @Column(DataType.JSONB)
  declare flaggedFields: FlaggedField[];

  @Column(DataType.JSONB)
  declare reasons: Reason[];

  @UpdatedAt
  declare lastSeenAt: Date;
}
